import React, {useEffect, useRef} from 'react';
import _                          from 'lodash';

/**
 * Ресайз элемент области просмотра за который происходит ресайз.
 *
 * Располагается всегда выше чем маска для перетаскивания.
 */
export default function ResizeElement(props) {
  const ref = useRef();
  
  /**
   * Положение области просмотра по оси X, Y и высота с шириной.
   *
   * Здесь я использую useRef потому что в его свойстве
   * current всегда находится актуальное состояние не зависящее от
   * области видимости.
   */
  let positionX = useRef(props.x);
  let positionY = useRef(props.y);
  let width     = useRef(props.width);
  let height    = useRef(props.height);
  
  useEffect(() => {
    const resizeElementNode = ref.current;
    
    /**
     * Стартовые позиции мышки от которых будет идти отсчет.
     */
    let startMousePositionX = null;
    let startMousePositionY = null;
    
    /**
     * Стартовые позиции области просмотра с верхней и правой стороны.
     */
    let startRightEdgePosition = null;
    let startTopEdgePosition   = null;
    
    /**
     * Обновление позиций и размеров при каждом изменении пропсов.
     */
    positionX.current = props.x;
    positionY.current = props.y;
    width.current     = props.width;
    height.current    = props.height;
    
    /**
     * Конвертирует пиксели в проценты.
     *
     * @param x
     * @returns {number}
     */
    const toPercentsConverterX = x => {
      const frameWidth = props.frame.getBoundingClientRect().width;
      return x / (frameWidth / 100);
    }
    
    /**
     * Конвертирует пиксели в проценты.
     *
     * @param y
     * @returns {number}
     */
    const toPercentsConverterY = y => {
      const frameHeight = props.frame.getBoundingClientRect().height;
      return y / (frameHeight / 100);
    }
    
    /**
     * Ограничивает положение области просмотра в процентах при ресайзе по оси X.
     *
     * @param x
     * @returns {number}
     */
    const restrictNewX = x => {
      if (x < 0) {
        x = 0;
      } else if (((props.x + props.width) - x) < props.minAreaWidth) {
        x = (props.x + props.width) - props.minAreaWidth;
      }
      
      return x;
    }
    
    /**
     * Ограничивает положение области просмотра в процентах при ресайзе по оси Y.
     *
     * @param y
     * @returns {number}
     */
    const restrictNewY = y => {
      if (y < 0) {
        y = 0;
      } else if (((props.y + props.height) - y) < props.minAreaHeight) {
        y = (props.y + props.height) - props.minAreaHeight;
      }
      
      return y;
    }
    
    /**
     * Ограничивает ширину области просмотра в процентах при ресайзе.
     *
     * @param x
     * @param width
     * @returns {number}
     */
    const restrictNewWidth = (x, width) => {
      if (width < props.minAreaWidth) {
        width = props.minAreaWidth;
      } else if (x + width > 100) {
        width = 100 - x;
      }
      
      return width;
    }
    
    /**
     * Ограничивает высоту области просмотра в процентах при ресайзе.
     *
     * @param y
     * @param height
     * @returns {number}
     */
    const restrictNewHeight = (y, height) => {
      if (height < props.minAreaHeight) {
        height = props.minAreaHeight;
      } else if (y + height > 100) {
        height = 100 - y;
      }
      
      return height;
    }
    
    /**
     * Определяет изменилось ли положение или размер области просмотра.
     *
     * Важно понимать, что из за замыкания в пропсах здесь будут храниться старые значения
     * которые были, при срабатывании функции mouseDownHandler, а в positionX, positionY
     * width и height будут актуальные значения потому что они были созданы с помощью useRef.
     *
     * Если создать positionX, positionY, width, height с помощью useState то они так же будут замкнуты
     * при mouseDownHandler и проверка будет невозможна.
     *
     * @returns {boolean}
     */
    const isAreaChanged = () => {
      const prevPositions    = [props.x, props.y, props.width, props.height];
      const currentPositions = [positionX.current, positionY.current, width.current, height.current];
      
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
      
      startMousePositionX    = e.pageX;
      startMousePositionY    = e.pageY;
      startRightEdgePosition = props.x + props.width;
      startTopEdgePosition   = props.y + props.height;
    }
    
    const mouseUpHandler = () => {
      window.removeEventListener('mouseup', mouseUpHandler);
      window.removeEventListener('mousemove', mouseMoveHandler);
      
      startMousePositionX    = null;
      startMousePositionY    = null;
      startRightEdgePosition = null;
      startTopEdgePosition   = null;
      
      /**
       * Сохраняю новое положение и размеры области просмотра на сервере если они изменилось.
       */
      if (isAreaChanged()) {
        props.save(positionX.current, positionY.current, width.current, height.current);
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
       * Обрабатывает левый ресайз
       */
      const leftHandler = () => {
        let width = restrictNewWidth(props.x + diffX, props.width - diffX);
        let x     = restrictNewX(props.x + diffX);
        
        if (x === 0) {
          width = startRightEdgePosition;
        }
        
        return {x, width};
      }
      
      /**
       * Обрабатывает правый ресайз
       */
      const rightHandler = () => {
        let width = restrictNewWidth(props.x, props.width + diffX);
        return {width};
      }
      
      /**
       * Обрабатывает верхний ресайз
       */
      const topHandler = () => {
        let height = restrictNewHeight(props.y + diffY, props.height - diffY);
        let y      = restrictNewY(props.y + diffY);
        
        if (y === 0) {
          height = startTopEdgePosition;
        }
        
        return {height, y};
      }
      
      /**
       * Обрабатывает нижний ресайз
       */
      const bottomHandler = () => {
        let height = restrictNewHeight(props.y, props.height + diffY);
        return {height};
      }
      
      let x = props.x, y = props.y, width = props.width, height = props.height;
      
      /**
       * Ниже запускаются нужные обработчики в зависимости от того, какие пропсы были переданы
       * элементу этого ресайзера.
       *
       * К примеру левый ресайзер получит пропс left
       * который будет автоматически приведен реактом к true если явно не указывать значение.
       * И соответственно будет запущен нужный обработчик.
       *
       * Одновременно может быть несколько пропсов положения к примеру
       * right и left. Тогда запустятся сразу два обработчика и произойдет ресайз
       * области просмотра сразу с двух сторон ( потянули за уголок ).
       */
      
      if (props.left) {
        ({x, width} = leftHandler());
      }
      
      if (props.top) {
        ({y, height} = topHandler());
      }
      
      if (props.bottom) {
        ({height} = bottomHandler());
      }
      
      if (props.right) {
        ({width} = rightHandler());
      }
      
      if (props.left) {
        props.onLeftResize(x, y, width, height);
      }
      
      if (props.right) {
        props.onRightResize(x, y, width, height);
      }
      
      if (props.top) {
        props.onTopResize(x, y, width, height);
      }
      
      if (props.bottom) {
        props.onBottomResize(x, y, width, height);
      }
    }
  
    resizeElementNode.addEventListener('mousedown', mouseDownHandler);
    return () => {
      resizeElementNode.removeEventListener('mousedown', mouseDownHandler);
    }
  }, [props]);
  
  const classes = [];
  
  if (props.right) {
    classes.push('right');
  }
  
  if (props.left) {
    classes.push('left');
  }
  
  if (props.top) {
    classes.push('top');
  }
  
  if (props.bottom) {
    classes.push('bottom');
  }
  
  if (props.corner) {
    classes.push('corner');
  } else {
    classes.push('edge');
  }
  
  return (
    <div ref={ref} className={classes.join(' ')}/>
  );
}