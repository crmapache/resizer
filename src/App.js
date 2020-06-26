import React from 'react';
import Frame from './Frame/Frame';

function App() {
  return (
    <div className="App">
      <Frame/>
      <a className={'github-link'}  target={'_blank'} href="https://github.com/spacenear/resizer">
        <i className="fab fa-github"></i>
      </a>
    </div>
  );
}

export default App;
