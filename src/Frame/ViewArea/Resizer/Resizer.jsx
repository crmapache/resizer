import React         from 'react';
import ResizeElement from './ResizeElement';
import './Resizer.scss';

/**
 * Контейнер для ресайз элементов в области просмотра.
 */
export default function Resizer(props) {
  return (
    <React.Fragment>
      <ResizeElement top {...props}/>
      <ResizeElement bottom {...props}/>
      <ResizeElement left {...props}/>
      <ResizeElement right {...props}/>
      <ResizeElement corner top left {...props}/>
      <ResizeElement corner top right {...props}/>
      <ResizeElement corner bottom left {...props}/>
      <ResizeElement corner bottom right {...props}/>
    </React.Fragment>
  );
};