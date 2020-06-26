import React, {useEffect, useState} from 'react';
import './Modal.scss';

export default function Modal(props) {
  const [count, setCount] = useState();
  const [color, setColor] = useState();
  
  const chooseCount = (
    <div>
      <div className={'title'}>
        How many areas do you wanna see? <br/>
        I think 10 is enough, but it's up to you.
      </div>
      <div className={'buttons-wrap'}>
        <div className={'button'} onClick={() => setCount(2)}>2</div>
        <div className={'button'} onClick={() => setCount(5)}>5</div>
        <div className={'button'} onClick={() => setCount(10)}>10</div>
        <div className={'button'} onClick={() => setCount(30)}>30</div>
        <div className={'button'} onClick={() => setCount(50)}>50</div>
        <div className={'button'} onClick={() => setCount(100)}>100</div>
        <div className={'button'} onClick={() => setCount(300)}>300</div>
        <div className={'button'} onClick={() => setCount(500)}>500</div>
        <div className={'button'} onClick={() => setCount(1000)}>1000</div>
      </div>
    </div>
  );
  
  const chooseColor = (
    <div>
      <div className={'title'}>And what color palette of areas do you want?</div>
      <div className={'buttons-wrap'}>
        <div className={'button'} onClick={() => setColor('random')}>random</div>
        <div className={'button'} onClick={() => setColor('red')}>red</div>
        <div className={'button'} onClick={() => setColor('orange')}>orange</div>
        <div className={'button'} onClick={() => setColor('yellow')}>yellow</div>
        <div className={'button'} onClick={() => setColor('green')}>green</div>
        <div className={'button'} onClick={() => setColor('blue')}>blue</div>
        <div className={'button'} onClick={() => setColor('purple')}>purple</div>
        <div className={'button'} onClick={() => setColor('pink')}>pink</div>
        <div className={'button'} onClick={() => setColor('monochrome')}>monochrome</div>
      </div>
    </div>
  );
  
  useEffect(() => {
    if (count && color) {
      props.onEnd(count, color);
    }
  }, [count, color]);
  
  return (
    <div className={'modal-wrap'}>
      <div className={'modal'}>
        {count ? chooseColor : chooseCount}
      </div>
    </div>
  );
};