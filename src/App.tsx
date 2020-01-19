import React from 'react';
// @ts-ignore
import CodeEditor from '@olefjaerestad/code-editor';
import Test from './Test';

// @ts-ignore
console.log(CodeEditor);
console.log(Test);

const App: React.FC = () => {
  return (
    <div className="App">
      <Test />
    </div>
  );
}

export default App;
