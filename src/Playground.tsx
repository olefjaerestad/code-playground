import React, {SyntheticEvent, useRef, useEffect, useState} from 'react';
import CodeEditor from './components/CodeEditor/CodeEditor'; // todo: replace with line below when npm module works correctly.
import './Playground.css';
// import CodeEditor from '@olefjaerestad/code-editor';
import {ReactComponent as ShareIcon} from './assets/svg/share.svg';
import {ReactComponent as ImportIcon} from './assets/svg/import.svg';
import {ReactComponent as ExportIcon} from './assets/svg/export.svg';
import {ReactComponent as PlayIcon} from './assets/svg/play.svg';
// import {ReactComponent as DownloadIcon} from './assets/svg/download.svg';
import {compressToUTF16, decompressFromUTF16} from 'lz-string';

const App: React.FC = () => {
	console.log('[Playground] render...');
	// state
	const [htmlState, setHtmlState] = useState('');
	const [cssState, setCssState] = useState('');
	const [jsState, setJsState] = useState('');
	const [title, setTitle] = useState('Untitled');
	const [shareToken, setShareToken] = useState('');
	const [tokenIsOpen, setTokenIsOpen] = useState(false);

	// refs
	const previewEl = useRef<HTMLDivElement>(null);
	const editorsEl = useRef<HTMLDivElement>(null);
	const runButtonEl = useRef<HTMLButtonElement>(null)
	const html = useRef<string>(''); // note: we're using these in addition to the state, so we can store values without rerendering child component.
	const css = useRef<string>('');
	const js = useRef<string>('');

	// handle editor resizing
	useEffect(() => {
		const editors: NodeList = document.querySelectorAll('.codeeditor');
		const mutationSettings: MutationObserverInit = {
			attributes: true,
		};
		const mutationCallback = (mutationList: MutationRecord[], observer: MutationObserver) => {
			const targetEditor = mutationList[0].target as HTMLDivElement;
			const targetIndex = Array.prototype.indexOf.call(editors, targetEditor);
			const adjacentEditor = (editors[targetIndex+1] || editors[targetIndex-1]) as HTMLDivElement;
			const leftoverEditor = editors[targetIndex === 0 ? 2 : 0] as HTMLDivElement;
			const width = targetEditor.style.width;
			const height = parseFloat(window.getComputedStyle(targetEditor, null).getPropertyValue('height'));
			const leftoverHeight = parseFloat(window.getComputedStyle(leftoverEditor, null).getPropertyValue('height'));
			const wrapperHeight = parseFloat(window.getComputedStyle(editorsEl.current as Element, null).getPropertyValue('height'));
			adjacentEditor.style.height = (wrapperHeight - height - leftoverHeight) + 'px';
			editors.forEach(el => (el as HTMLDivElement).style.width = width);
		};
		const mutationObserver: MutationObserver = new MutationObserver(mutationCallback);
		editors.forEach((el, i: number) => mutationObserver.observe(el, mutationSettings));
	}, []);

	const changeHandler = (code: string, language: string, e: SyntheticEvent|undefined) => {
		switch (language) {
			case 'html':
				html.current = code;
				break;
			case 'css':
				css.current = code;
				break;
			case 'js':
				js.current = code;
				break;
			default:
				break;
		}
	}

	const run = () => {
		highlightRunButton();
		// @ts-ignore
		if (document.getElementById('output')) previewEl.current.removeChild(document.getElementById('output'));
		const iframe = document.createElement('iframe');
		iframe.id = 'output';
		if (previewEl.current) previewEl.current.appendChild(iframe);
		// @ts-ignore
		const iframeDocument = iframe.contentWindow.document;

		iframeDocument.open();
		iframeDocument.writeln(`<body>${html.current}</body><style>${css.current}</style><script>${js.current}</script>`);
		iframeDocument.close();
	}

	const highlightRunButton = () => {
		runButtonEl.current?.classList.add('isActive');
		setTimeout(() => runButtonEl.current?.classList.remove('isActive'), 1000);
	}

	const generateShareToken = (e: SyntheticEvent) => {
		try {
			const tokenString = compressToUTF16(JSON.stringify({
				title,
				html: html.current,
				css: css.current,
				js: js.current,
			}));
			setShareToken(tokenString);
		} catch(e) {
			console.log('Couldn\'t generate share token. The generator uses JSON.stringify(), so this might be due to bad JSON. Try checking your code for errors.');
		}
	}

	const importShareToken = (e: SyntheticEvent) => {
		try {
			const tokenObj = JSON.parse(decompressFromUTF16(shareToken));

			if ( 
			!tokenObj.hasOwnProperty('title') || 
			!tokenObj.hasOwnProperty('html') || 
			!tokenObj.hasOwnProperty('css') || 
			!tokenObj.hasOwnProperty('js') ) {
				throw new Error('The token is missing one of these properties: title, html, css, js');
			}

			// todo: the following lines don't update the ui. need to find a solution (preferably without using state, in order to avoid overly eager dom updates when typing in the code editors).
			html.current = tokenObj.html;
			css.current = tokenObj.css;
			js.current = tokenObj.js;
			setHtmlState(tokenObj.html);
			setCssState(tokenObj.css);
			setJsState(tokenObj.js);
			setTitle(tokenObj.title);
			run();
			
		} catch(e) {
			console.warn('Couldn\'t import share token. The generator uses JSON.parse(), so this might be due to bad JSON. Try checking your code for errors. The error was: \n', e);
		}
	}

	const keyDownHandler = (e: SyntheticEvent) => {
		const event = e as unknown as KeyboardEvent;
		if ( event.key === 's' &&  event.metaKey) {
			e.preventDefault();
			run();
		}
	}

	return (
		<div className="playground" onKeyDown={keyDownHandler}>

			{/* grid */}
			{/* <div className="playground__meta">Meta</div>
			<CodeEditor language="html" value="" useLanguageSwitcher={false} onChange={changeHandler} />
			<CodeEditor language="css" value="" useLanguageSwitcher={false} onChange={changeHandler} />
			<CodeEditor language="js" value="" useLanguageSwitcher={false} onChange={changeHandler} />
			<div className="playground__preview" ref={previewEl}></div> */}

			{/* flexbox */}
			<div className="playground__meta">
				<div className="playground__meta__title">
					<input type="text" value={title} placeholder="Project title" onChange={e => setTitle(e.target.value)} />
				</div>
				<div className="playground__meta__share">
					<button className="iconBtn" title="Run code" onClick={run} ref={runButtonEl}><PlayIcon /></button>
					{(shareToken || tokenIsOpen) && <input type="text" value={shareToken} placeholder="Your share token" onChange={e => setShareToken(e.target.value)} />}
					<button className="iconBtn" title="Generate a share token that others can import in order to view your code" onClick={generateShareToken}><ShareIcon /></button>
					<button className="iconBtn" title="Import share token" onClick={e => shareToken.length > 0 ? importShareToken(e) : setTokenIsOpen(!tokenIsOpen)}><ImportIcon /></button>
					<button className="iconBtn" title="Export project files"><ExportIcon /></button>
					{/* <button className="iconBtn" title="Download project"><DownloadIcon/></button> */}
				</div>
			</div>
			<div className="playground__main">
				<div className="playground__main__editors" ref={editorsEl}>
					<CodeEditor language="html" value={JSON.stringify(htmlState)} useLanguageSwitcher={false} onChange={changeHandler} />
					<CodeEditor language="css" value={JSON.stringify(cssState)} useLanguageSwitcher={false} onChange={changeHandler} />
					<CodeEditor language="js" value={JSON.stringify(jsState)} useLanguageSwitcher={false} onChange={changeHandler} />
				</div>
				<div className="playground__main__preview" ref={previewEl}></div>
			</div>
			
		</div>
	);
}

export default App;
