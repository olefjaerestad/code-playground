import React, {SyntheticEvent, useRef, useEffect} from 'react';
import CodeEditor from './components/CodeEditor/CodeEditor'; // todo: replace with line below when npm module works correctly.
import './Playground.css';
// import CodeEditor from '@olefjaerestad/code-editor';

const App: React.FC = () => {
	const previewEl = useRef<HTMLDivElement>(null);
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
		const observables: NodeList = document.querySelectorAll('.codeeditor');
		const mutationSettings: MutationObserverInit = {
			attributes: true,
		};
		const mutationCallback = (mutationList: MutationRecord[], observer: MutationObserver) => {
			const target = mutationList[0].target as HTMLDivElement;
			const width = target.style.width;
			const height = target.style.height;
			// target.style.minHeight = target.style.maxHeight = height;
			document.querySelectorAll('.codeeditor').forEach(el => (el as HTMLDivElement).style.width = width);
		};
		const mutationObserver: MutationObserver = new MutationObserver(mutationCallback);
		observables.forEach(el => mutationObserver.observe(el, mutationSettings));
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
			<div className="playground__meta">Meta</div>
			<div className="playground__main">
				<div className="playground__main__editors">
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
