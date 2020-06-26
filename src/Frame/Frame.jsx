import React, {useEffect, useState} from 'react';
import ViewArea                     from './ViewArea/ViewArea';
import Modal                        from '../Modal/Modal';
import randomColor                  from 'randomcolor';
import _                            from 'lodash';
import EdgesManager                 from './EdgesManager';
import './Frame.scss';

export default function Frame(props) {
  const [ref, setRef] = useState();
  
  const [viewAreasCount, setViewAreasCount] = useState();
  const [viewAreasColor, setViewAreasColor] = useState();
  const [viewAreas, setViewAreas]           = useState();
  const [edgesManager, setEdgesManager]     = useState();
  
  /**
   * Добавляю грани для фрейма
   *
   * 2 горизонтальных грани по краям и 1 по центру
   * 2 вертикальных грани по краям и 1 по центру
   *
   * @see EdgesManager ( подробнее о гранях )
   */
  const setFieldEdges = () => {
    edgesManager.addVerticalEdge(0, [[0, 0], [0, 100]], true);
    edgesManager.addVerticalEdge(50, [[50, 0], [50, 100]], true);
    edgesManager.addVerticalEdge(100, [[100, 0], [100, 100]], true);
    edgesManager.addHorizontalEdge(0, [[0, 0], [100, 0]], true);
    edgesManager.addHorizontalEdge(50, [[0, 50], [100, 50]], true);
    edgesManager.addHorizontalEdge(100, [[0, 100], [100, 100]], true);
  }
  
  /**
   * Создание EdgesManager после первого рендера компонента и получения
   * ссылки на узел фрейма
   *
   * Важно что бы EdgesManager создался только раз со ссылкой на узел фрейма
   * и после этого не обновлялся, поэтому есть проверки.
   */
  useEffect(() => {
    if (ref && !edgesManager) {
      setEdgesManager(new EdgesManager(ref));
    }
  }, [ref, edgesManager]);
  
  /**
   * Создаю области просмотра.
   *
   * После того, как edgesManager будет в нужной кондиции
   * запускается этот хук и создает области просмотра.
   * После этого перезапустится компонент и области отрисуются с нужными зависимостями.
   */
  useEffect(() => {
    if (edgesManager) {
      const areas = [];
      
      for (let i = 0; i < viewAreasCount; i++) {
        let width  = _.random(20, 25);
        let height = _.random(width - (width / 100 * 20), width + (width / 100 * 20));
        let left   = _.random(0, 100 - width);
        let top    = _.random(0, 100 - height);
        
        let colorData = {
          alpha: 0.7,
          luminosity: 'light',
          format: 'rgba'
        }
        
        if (viewAreasColor !== 'random') {
          colorData.hue = viewAreasColor;
        }
        
        areas.push((
          <ViewArea
            left={left} top={top}
            width={width} height={height}
            color={randomColor(colorData)}
            key={i}
            frame={ref} edgesManager={edgesManager}
            palette={viewAreasColor}
          />
        ));
      }
      
      setViewAreas(areas);
    }
  }, [edgesManager, ref, viewAreasCount, viewAreasColor]);
  
  /**
   * Добавляю грани к фрейму.
   *
   * Важно что бы они добавились только один раз, а не при каждой отрисовке.
   */
  useEffect(() => {
    if (edgesManager) {
      setFieldEdges();
    }
  }, [edgesManager]);
  
  return (
    <div className={'frame'} ref={ref => setRef(ref)}>
      {viewAreasCount ? viewAreas : <Modal onEnd={(count, color) => {
        setViewAreasCount(count);
        setViewAreasColor(color);
      }}/>}
      <div className={'rails'}></div>
    </div>
  );
};