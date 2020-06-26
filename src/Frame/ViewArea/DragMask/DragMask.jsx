import React, {useEffect, useRef} from 'react';
import './DragMask.scss';
import _ from "lodash";

/**
 * Маска области просмотра за которую происходит перетаскивание
 */
export default function DragMask(props) {
  const ref = useRef();
  
  /**
   * Положение области просмотра по оси X и Y.
   *
   * Здесь я использую useRef потому что в его свойстве
   * current всегда находится актуальное состояние не зависящее от
   * области видимости.
   */
  let positionX = useRef(props.x);
  let positionY = useRef(props.y);
  
  useEffect(() => {
    const mask = ref.current;
    
    /**
     * Стартовые позиции мышки от которых будет идти отсчет.
     */
    let startMousePositionX = null;
    let startMousePositionY = null;
    
    /**
     * Обновление позиций при каждом изменении пропсов.
     */
    positionX.current = props.x;
    positionY.current = props.y;
    
    /**
     * Конвертирует пиксели в проценты.
     *
     * @param x
     * @returns {number}
     */
    const toPercentsConverterX = x => {
      const fieldWidth = props.frame.getBoundingClientRect().width;
      return x / (fieldWidth / 100);
    }
    
    /**
     * Конвертирует пиксели в проценты.
     *
     * @param y
     * @returns {number}
     */
    const toPercentsConverterY = y => {
      const fieldHeight = props.frame.getBoundingClientRect().height;
      return y / (fieldHeight / 100);
    }
    
    /**
     * Ограничивает положение области просмотра в процентах при перетаскивании по оси X.
     *
     * @param x
     * @returns {number}
     */
    const restrictNewPositionX = x => {
      const areaWidth = props.area.current.getBoundingClientRect().width;
      const areaSizeX = toPercentsConverterX(areaWidth);
      
      if (x < 0) {
        x = 0;
      } else if (x + areaSizeX > 100) {
        x = 100 - areaSizeX;
      }
      
      return x;
    }
    
    /**
     * Ограничивает положение области просмотра в процентах при перетаскивании по оси Y.
     *
     * @param y
     * @returns {number}
     */
    const restrictNewPositionY = y => {
      const areaHeight = props.area.current.getBoundingClientRect().height;
      const areaSizeY  = toPercentsConverterY(areaHeight);
      
      if (y < 0) {
        y = 0;
      } else if (y + areaSizeY > 100) {
        y = 100 - areaSizeY;
      }
      
      return y;
    }
    
    /**
     * Определяет изменилось ли положение области просмотра.
     *
     * Важно понимать, что из за замыкания в пропсах здесь будут храниться старые значения
     * которые были, при срабатывании функции mouseDownHandler, а в positionX и positionY
     * будут актуальные значения потому что они были созданы с помощью useRef.
     *
     * Если создать positionX и positionY с помощью useState то они так же будут замкнуты
     * при mouseDownHandler и проверка будет невозможна.
     *
     * @returns {boolean}
     */
    const isAreaChanged = () => {
      const prevPositions = [props.x, props.y,];
      const currentPositions = [positionX.current, positionY.current];
      
      return !_.isEqual(prevPositions, currentPositions);
    }
    
    const mouseDownHandler = e => {
      
      /**
       * Важно, иначе могут быть глюки.
       */
      e.stopPropagation();
      e.preventDefault();
      
      window.addEventListener('mouseup', mouseUpHandler);
      window.addEventListener('mousemove', mouseMoveHandler);
      
      startMousePositionX = e.pageX;
      startMousePositionY = e.pageY;
    }
    
    const mouseUpHandler = () => {
      window.removeEventListener('mouseup', mouseUpHandler);
      window.removeEventListener('mousemove', mouseMoveHandler);
      
      startMousePositionX = null;
      startMousePositionY = null;
      
      /**
       * Сохраняю новое положение области просмотра на сервере если оно изменилось.
       */
      if (isAreaChanged()) {
        props.save(positionX.current, positionY.current, props.width, props.height);
      }
      
      /**
       * Удаляю указатели.
       */
      props.edgesManager.removeRails();
    }
    
    const mouseMoveHandler = e => {
      /**
       * Разница между начальным положением мышки и настоящим
       * конвертированая в проценты.
       */
      let diffX = toPercentsConverterX(e.pageX - startMousePositionX);
      let diffY = toPercentsConverterY(e.pageY - startMousePositionY);
      
      /**
       * Новые позиции области просмотра.
       */
      const newPositionX = restrictNewPositionX(props.x + diffX);
      const newPositionY = restrictNewPositionY(props.y + diffY);
      
      /**
       * Передаю новые позиции области просмотра в обработчик перетаскивания.
       */
      props.onDrag(newPositionX, newPositionY);
    }
  
    mask.addEventListener('mousedown', mouseDownHandler);
    return () => {
      mask.removeEventListener('mousedown', mouseDownHandler);
    }
  }, [props]);
  
  return (
    <div ref={ref} className={'drag-mask'} draggable={false}/>
  );
}