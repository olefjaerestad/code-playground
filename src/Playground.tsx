import React, {SyntheticEvent, useRef, useEffect, useState} from 'react';
import CodeEditor from './components/CodeEditor/CodeEditor'; // todo: replace with line below when npm module works correctly.
import './Playground.css';
// import CodeEditor from '@olefjaerestad/code-editor';
import {ReactComponent as ShareIcon} from './assets/svg/share.svg';
import {ReactComponent as ImportIcon} from './assets/svg/import.svg';
import {ReactComponent as ExportIcon} from './assets/svg/export.svg';
// import {ReactComponent as DownloadIcon} from './assets/svg/download.svg';
import {compress, decompress} from 'lz-string';

const App: React.FC = () => {
	const [title, setTitle] = useState('Untitled');
	const [shareToken, setShareToken] = useState('');
	const previewEl = useRef<HTMLDivElement>(null);
	const editorsEl = useRef<HTMLDivElement>(null);
	const html = useRef<string>('');
	const css = useRef<string>('');
	const js = useRef<string>('');

	const changeHandler = (code: string, language: string, e: SyntheticEvent|undefined) => {
		// localStorage.setItem( 'code', JSON.stringify(code) );
		// @ts-ignore
		if (document.getElementById('output')) previewEl.current.removeChild(document.getElementById('output'));
		const iframe = document.createElement('iframe');
		iframe.id = 'output';
		if (previewEl.current) previewEl.current.appendChild(iframe);
		// @ts-ignore
		const iframeDocument = iframe.contentWindow.document;
	
		iframeDocument.open();
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
		iframeDocument.writeln(`<body>${html.current}</body><style>${css.current}</style><script>${js.current}</script>`);
		iframeDocument.close();
	}

	const generateShareToken = (e: SyntheticEvent) => {
		try {
			const tokenString = compress(JSON.stringify({
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
			const tokenObj = JSON.parse(decompress(shareToken));

			if ( 
			!tokenObj.hasOwnProperty('title') || 
			!tokenObj.hasOwnProperty('html') || 
			!tokenObj.hasOwnProperty('css') || 
			!tokenObj.hasOwnProperty('js') ) {
				throw new Error('The token is missing one of these properties: title, html, css, js');
			}

			console.log(tokenObj);

			setTitle(tokenObj.title);
			// todo: the following lines don't update the ui. need to find a solution (preferably without using state, in order to avoid overly eager dom updates when typing in the code editors).
			html.current = tokenObj.html;
			css.current = tokenObj.css;
			js.current = tokenObj.js;
		} catch(e) {
			console.warn('Couldn\'t import share token. The generator uses JSON.parse(), so this might be due to bad JSON. Try checking your code for errors. The error was', e);
		}
	}

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

	return (
		<div className="playground">

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
					<input type="text" value={shareToken} placeholder="Your share token" onChange={e => setShareToken(e.target.value)} />
					<button className="iconBtn" title="Generate a share token that others can import" onClick={generateShareToken}><ShareIcon/></button>
					<button className="iconBtn" title="Import share token" onClick={importShareToken}><ImportIcon/></button>
					<button className="iconBtn" title="Export project files"><ExportIcon/></button>
					{/* <button className="iconBtn" title="Download project"><DownloadIcon/></button> */}
				</div>
			</div>
			<div className="playground__main">
				<div className="playground__main__editors" ref={editorsEl}>
					<CodeEditor language="html" useLanguageSwitcher={false} onChange={changeHandler} />
					<CodeEditor language="css" useLanguageSwitcher={false} onChange={changeHandler} />
					<CodeEditor language="js" useLanguageSwitcher={false} onChange={changeHandler} />
				</div>
				<div className="playground__main__preview" ref={previewEl}></div>
			</div>
			
		</div>
	);
}

export default App;
