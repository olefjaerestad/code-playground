import React, {SyntheticEvent, useRef, useEffect, useState} from 'react';
import CodeEditor from './components/CodeEditor/CodeEditor'; // todo: replace with line below when npm module works correctly.
import './Playground.css';
// import CodeEditor from '@olefjaerestad/code-editor';
import {ReactComponent as ShareIcon} from './assets/svg/share.svg';

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
		// let editorHeight = '';
		editors.forEach((el, i: number) => {
			// const htmlEl = el as HTMLDivElement;
			// const height = window.getComputedStyle(htmlEl, null).getPropertyValue('height');

			// if (i === 0) editorHeight = height.replace('px', '');
			// htmlEl.style.flex = editorHeight;
			mutationObserver.observe(el, mutationSettings);
		});
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
				<div>
					<input type="text" value={title} placeholder="Project title" onChange={e => setTitle(e.target.value)} />
				</div>
				<div>
					<input type="text" defaultValue={shareToken} placeholder="Your share token" />
					<button title="Generate share token"><ShareIcon/></button>
					<button>Import share token</button>
				</div>
			</div>
			<div className="playground__main">
				<div className="playground__main__editors" ref={editorsEl}>
					<CodeEditor language="html" value="" useLanguageSwitcher={false} onChange={changeHandler} />
					<CodeEditor language="css" value="" useLanguageSwitcher={false} onChange={changeHandler} />
					<CodeEditor language="js" value="" useLanguageSwitcher={false} onChange={changeHandler} />
				</div>
				<div className="playground__main__preview" ref={previewEl}></div>
			</div>
			
		</div>
	);
}

export default App;
