import React, { useState, SyntheticEvent, useRef, useEffect } from 'react';
import './CodeEditor.css';

// https://stackoverflow.com/questions/7745867/how-do-you-get-the-cursor-position-in-a-textarea
// http://blog.stevenlevithan.com/archives/mimic-lookbehind-javascript
// todo: ask for confirmation before closing app? no. do it in the full code playground app instead.
const CodeEditor: React.FC<{onChange?: Function, language?: string, useLanguageSwitcher?: boolean, value?: string}> = (props: any) => {
	console.log('[CodeEditor] render...');
	// settings.
	const languages = ['html', 'js', 'css'];
	const useLanguageSwitcher = props.useLanguageSwitcher !== undefined ? props.useLanguageSwitcher : true;
	const indentSize = 2;

	// state.
	const [language, setLanguage] = useState(props.language && languages.includes(props.language) ? props.language : 'html');
	const [code, setCode] = useState(props.value ? JSON.parse(props.value) : '');
	const [prettycode, setPrettyCode] = useState('');
	const [rowHeights, setRowHeights] = useState<number[]>([18]);
	const [currentRow, setCurrentRow] = useState(1);
	const [currentCol, setCurrentCol] = useState(1);

	// refs.
	const textArea = useRef<HTMLTextAreaElement>(null);
	const prettycodeEl = useRef<HTMLPreElement>(null);
	const rowsEl = useRef<HTMLDivElement>(null);
	const testLetter = useRef<HTMLSpanElement>(null);
	const animationId = useRef<number>(0);

	// use regex to map code to css classes, for color highlighting.
	const classMappings = {
		html: [
			{
				// code: /&lt;[^&lt;]+&gt;/gm, // todo: this doesnt work with <div class="">, <table>, <style>, <script> or any tag containing 'l' or 't'
				// code: /&lt;[^&;]+&gt;/gm,
				// code: /&lt;[^&\b]+&gt;/gm,
				code: /(&lt;[^&; ]*|&gt;)/gm,
				classes: 'c--blue',
			},
			{
				code: /('.*'|&#34;.*&#34;)/gm,
				classes: 'c--orange',
			},
		],
		js: [
			{
				code: /(var|let|const|function|=&gt;|class|new|true)/gm,
				classes: 'c--blue',
			},
			{
				code: /(console|window|document|Math)/gm,
				classes: 'c--cyan',
			},
			{
				code: /#?(\d+)/gm, // # explained in wrapInSpan()
				classes: 'c--green',
			},
			{
				code: /('.*'|`.*`|&#34;.*&#34;)/gm,
				classes: 'c--orange',
			},
			{
				code: /(if|else|return|\.{3})/gm,
				classes: 'c--purple',
			},
			{
				code: /(\w+\()/gm,
				classes: 'c--yellow',
			},
			{
				code: /({|})/gm,
				classes: 'c--white',
			},
			{
				code: /(\/\*.*\*\/)/gm,
				classes: 'c--gray',
			},
			{
				code: /(\/\/[^\n]*)/gm,
				classes: 'c--gray',
			},
		],
		css: [
			{
				code: /((.|\n)*{|})/gm,
				classes: 'c--lightorange',
			},
			{
				code: /(:.*;)/gm,
				classes: 'c--orange',
			},
			{
				code: /[^#](\d+)[^; <]*/gm, // # explained in wrapInSpan()
				classes: 'c--green',
			},
			{
				code: /({|}|:|;)/gm,
				classes: 'c--white',
			},
			{
				code: /(\/\*.*\*\/)/gm,
				classes: 'c--gray',
			},
		],
	};

	// makes sure code passed in props.value on component init gets prettified.
	// useEffect(() => {
	// 	prettifyCode(code);
	// 	setRowHeights(getRowHeights());
	// }, []);
	// makes sure code passed in props.value updates the state
	useEffect(() => {
		if (props.value) {
			const latestCode = JSON.parse(props.value);
			setCode(latestCode);
			prettifyCode(latestCode);
			setRowHeights(getRowHeights(latestCode));
		}
	}, [props.value]);

	// makes sure code passed in props.value gets passed to props.onChange on component init.
	useEffect(() => {
		if (code) {
			props.onChange(code, language, undefined);
		}
	}, []);

	const changeHandler = (e: SyntheticEvent) => {
		// @ts-ignore
		const latestCode = e.target.value;
		setCode(latestCode);
		prettifyCode(latestCode);
		props.onChange(latestCode, language, e);
	}

	const keyDownHandler = (e: SyntheticEvent) => {
		// @ts-ignore
		const key = e.key;
		const cursorPos = textArea.current?.selectionStart;

		cancelAnimationFrame(animationId.current);
		animationId.current = requestAnimationFrame(scrollElements);

		if (key === 'Tab') {
			e.preventDefault();

			// adjust cursor placement after pressing tab. avoids cursor always moving to last pos.
			if (cursorPos !== undefined) {
				const indent = Array(indentSize).fill(' ').join('');
				const latestCode = code.substr(0, cursorPos) + indent + code.substr(cursorPos);
				// const latestCode = code.substr(0, cursorPos) + '\t' + code.substr(cursorPos);
				// @ts-ignore
				setTimeout(() => {textArea.current.selectionStart = cursorPos+indentSize; textArea.current.selectionEnd = cursorPos+indentSize}, 1); // setTimeout required
				setCode(latestCode);
				prettifyCode(latestCode);
			}
		}
	}

	const keyUpHandler = (e: SyntheticEvent) => {
		// @ts-ignore
		const key = e.key;

		cancelAnimationFrame(animationId.current);
		animationId.current = requestAnimationFrame(scrollElements);
		
		if (key === 'Enter') autoIndent();
		setTimeout(() => {
			setRowHeights(getRowHeights());
			setCurrentRow(getCurrentRow());
			setCurrentCol(getCurrentCol());
		}, 1); // setTimeout required
	}

	const scrollHandler = (e: SyntheticEvent) => {
		cancelAnimationFrame(animationId.current);
		animationId.current = requestAnimationFrame(scrollElements);
	}

	const prettifyCode = (code: string, lang?: string) => {
		lang = lang || language;
		// https://www.freeformatter.com/html-entities.html
		let formattedCode: string = code
			.replace(/</gm, '&lt;')
			.replace(/>/gm, '&gt;')
			.replace(/"/gm, '&#34;');
			// .replace(/\n/gm, '<br>');
			// .replace(/ /gm, '&ensp;');
		const wrapInSpan = (classes: string) => (match: string, group1: any, offset: any, string: any) => {
			// avoid breaking htmlentities
			if (Number(match.substr(1)) && match[0] === '#') {
				return match;
			}
			return `<span class="${classes}">${match}</span>`;
		}
		const wrapHtmlNodeInSpan = (classes: string) => (match: any, group1: any, offset: any, string: any) => {
			return ['<br>'].includes(match) ? match : `<span class="${classes}">${match}</span>`;
		}

		// classMappings[language].forEach(mapping => formattedCode = formattedCode.replace(mapping.code, wrapInSpan(mapping.classes)));
		// @ts-ignore
		switch (lang) {
			case 'html':
				// @ts-ignore
				if (classMappings[lang]) classMappings[lang].forEach(mapping => formattedCode = formattedCode.replace(mapping.code, wrapHtmlNodeInSpan(mapping.classes)));
				break;
			default:
				// @ts-ignore
				if (classMappings[lang]) classMappings[lang].forEach(mapping => formattedCode = formattedCode.replace(mapping.code, wrapInSpan(mapping.classes)));
				break;
		}

		setPrettyCode(formattedCode);
	}

	const getRowHeights = (code?: string): number[] => {
		let rows: number[] = [];
		const latestCode = code || textArea.current?.value;
		// const cursorPos = textArea.current?.selectionStart;
		const currentRows = (latestCode || '').split('\n');
		// @ts-ignore
		// const fontSize = parseInt(getComputedStyle(textArea.current).getPropertyValue('--font-size'));
		const textAreaWidth = (textArea.current?.getBoundingClientRect().width || 0) - 20; // -20 for padding
		const letterWidth = (testLetter.current?.getBoundingClientRect().width || 0);
		const letterHeight = (testLetter.current?.getBoundingClientRect().height || 0);
		const lettersPrLine = Math.floor(textAreaWidth/letterWidth);

		for ( var i = 0; i < currentRows.length; ++i ) {
			var letters = currentRows[i];
			const height = Math.max(Math.ceil(letters.length/lettersPrLine), 1) * letterHeight;
			rows.push(height);
		}

		return rows;
	}

	const getCurrentRow = (): number => {
		const latestCode = textArea.current?.value;
		const cursorPos = textArea.current?.selectionStart;
		const theCurrentRow = latestCode?.substr(0, cursorPos).split('\n').length || 1;
		return theCurrentRow;
	}

	const getCurrentCol = (): number => {
		const latestCode = textArea.current?.value;
		const cursorPos = textArea.current?.selectionStart;
		const lastLineBreakIndex = latestCode?.substr(0, cursorPos).lastIndexOf('\n');
		const theCurrentCol = (cursorPos||0) - (lastLineBreakIndex||0);
		return theCurrentCol;
	}

	const autoIndent = (): void => {
		const cursorPos = textArea.current?.selectionStart;

		if (cursorPos !== undefined) {
			const codeInCurrentRow = code.split('\n')[currentRow-1];
			const characterToLeft = code[cursorPos-2];
			const characterToRight = code[cursorPos];
			const indent = Array(indentSize).fill(' ').join('');
			let indentsToAdd = codeInCurrentRow.split(indent).length - 1;
			const indentsToAddOnNewLine = indentsToAdd;
			let addNewLine = false;
			if ( ['{'].includes(characterToLeft) ) {
				++indentsToAdd;

				if ( ['}'].includes(characterToRight) ) {
					addNewLine = true;
				}
			}
			const indents = Array(indentsToAdd).fill(indent).join('');
			const indentsOnNewLine = Array(indentsToAddOnNewLine).fill(indent).join('');
			const latestCode = code.substr(0, cursorPos) + indents + (addNewLine ? `\n${indentsOnNewLine}` : '') + code.substr(cursorPos);
			
			// @ts-ignore
			setTimeout(() => {textArea.current.selectionStart = cursorPos+indents.length; textArea.current.selectionEnd = cursorPos+indents.length}, 1); // setTimeout required
			setCode(latestCode);
			prettifyCode(latestCode);
		}
	}

	const scrollElements = (): void => {
		const scrollTop = textArea.current?.scrollTop;
		// @ts-ignore
		prettycodeEl.current.style.transform = rowsEl.current.style.transform = `translate3d(0, -${scrollTop}px, 0)`;
	}

	return (
		<div className="codeeditor">
			<div className="codeeditor__content">
				<div className="codeeditor__content__rows">
					<div className="codeeditor__content__rows__inner" ref={rowsEl}>
						{rowHeights.map((height: number, i: number) => <div key={i} style={{height: `${height}px`}}>{i+1}</div>)}
					</div>
				</div>
				<div className="codeeditor__content__main">
					<textarea
					className="codeeditor__content__main__writer" 
					placeholder={`${language} here...`}
					spellCheck="false" 
					ref={textArea}
					value={code}
					onChange={changeHandler}
					onKeyDown={keyDownHandler}
					onKeyUp={keyUpHandler}
					onMouseUp={keyUpHandler}
					onScroll={scrollHandler}></textarea>

					<pre
					className="codeeditor__content__main__pretty"
					ref={prettycodeEl}
					dangerouslySetInnerHTML={{__html: prettycode}}></pre>
				</div>
				<span ref={testLetter} className="codeeditor__content__testletter">i</span>
			</div>

			<div className="codeeditor__meta">
				<span>Row: {currentRow}</span>
				<span>Col: {currentCol}</span>
				<span>Characters: {code.length}</span>
				{useLanguageSwitcher ? <select
				value={language}
				onChange={(e) => {setLanguage(e.target.value); prettifyCode(textArea.current?.value || '', e.target.value);}}>
					{languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
				</select> : <span>{language}</span>}
			</div>
		</div>
	);
}

export default CodeEditor;
