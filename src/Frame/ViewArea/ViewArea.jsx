import React, {useEffect, useRef, useState} from 'react';
import Resizer                              from './Resizer/Resizer';
import DragMask                             from './DragMask/DragMask';
import anime                                from 'animejs';
import randomColor                          from 'randomcolor';
import _                                    from 'lodash';
import './ViewArea.scss';

function throttle(func, ms) {
  
  let isThrottled = false,
      savedArgs,
      savedThis;
  
  function wrapper() {
    
    if (isThrottled) { // (2)
      savedArgs = arguments;
      savedThis = this;
      return;
    }
    
    func.apply(this, arguments); // (1)
    
    isThrottled = true;
    
    setTimeout(function () {
      isThrottled = false; // (3)
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = savedThis = null;
      }
    }, ms);
  }
  
  return wrapper;
}

export default function ViewArea(props) {
  const ref = useRef();
  
  /**
   * Минимальный размер области просмотра по ширине в процентах
   * @type {number}
   */
  const minAreaWidth = 5;
  
  /**
   * Минимальный размер области просмотра по высоте  в процентах
   * @type {number}
   */
  const minAreaHeight = 5;
  
  /**
   * Позиции и размеры области просмотра
   */
  const [positionX, setPositionX] = useState(props.left);
  const [positionY, setPositionY] = useState(props.top);
  const [width, setWidth]         = useState(props.width);
  const [height, setHeight]       = useState(props.height);
  
  /**
   * Ключи граней области просмотра в EdgesManager
   *
   * @see EdgesManager
   */
  const [leftEdgeKey, setLeftEdgeKey]                         = useState();
  const [rightEdgeKey, setRightEdgeKey]                       = useState();
  const [topEdgeKey, setTopEdgeKey]                           = useState();
  const [bottomEdgeKey, setBottomEdgeKey]                     = useState();
  const [verticalMiddleEdgeKey, setVerticalMiddleEdgeKey]     = useState();
  const [horizontalMiddleEdgeKey, setHorizontalMiddleEdgeKey] = useState();
  
  /**
   * Сохраняет положение областей просмотра в базу данных
   * @param positionsData
   */
  const saveViewAreaPosition = (x, y, width, height) => {
  
  }
  
  /**
   * Принимает на вход массив из точек вида [x, y]
   * и выбирает из них две наиболее удаленные друг от друга.
   *
   * Возвращает массив из двух точек вида [x, y]
   *
   * @param points
   * @returns array
   */
  const findFarthestPoints = (points) => {
    let results = {};
    
    for (let i = 0; i < points.length; i++) {
      for (let j = 0; j < points.length; j++) {
        if (i !== j) {
          let distance = Math.sqrt(Math.pow(points[j][0] - points[i][0], 2) + Math.pow(points[j][1] - points[i][1], 2));
          if (!results[i] || distance > results[i].distance) {
            results[i] = {
              distance: distance,
              pointKey: j,
            }
          }
        }
      }
    }
    
    let farthestDistance = 0;
    let farthestKey      = null;
    
    for (let key of Object.keys(results)) {
      if (results[key].distance > farthestDistance) {
        farthestDistance = results[key].distance;
        farthestKey      = key;
      }
    }
    
    let point1 = points[farthestKey];
    let point2 = points[results[farthestKey].pointKey];
    
    return [point1, point2];
  }
  
  /**
   * Принимает две точки вида [x, y]
   * и выбирает какая из них будет стартовой точкой для отрисовки
   * линеек, а какая конечной.
   *
   * @param point1
   * @param point2
   * @returns array
   */
  const orderPoints = (point1, point2) => {
    if (
      (point1[0] === point2[0] && point1[1] < point2[1]) ||
      (point1[0] !== point2[0] && point1[0] < point2[0])
    ) {
      return [point1, point2];
    }
    
    return [point2, point1];
  }
  
  /**
   * Отрисовка указателя для левой грани области просмотра
   *
   * Если грань к которой примагничивается область имеет статус true в поле overall,
   * то будет отрисован указатель на всю высоту фрейма.
   * Статус overall = true имеют только грани фрейма.
   *
   * @param magneticLeftEdge
   * @param x
   * @param y
   * @param height
   */
  const drawLeftRail = (magneticLeftEdge, x, y, height) => {
    if (magneticLeftEdge.overall) {
      
      /**
       * Рисую указатель высотой на весь фрейм
       */
      props.edgesManager.addVerticalRail(
        magneticLeftEdge.points[0][0], 0,
        magneticLeftEdge.points[0][0], 100
      );
    } else {
      
      /**
       * Массив с точками граней.
       *
       * Две точки на грани к которой область магнитится и две точки
       * на грани самой области с левой стороны
       *
       * @type array
       */
      let pointsToChoose = [
        [magneticLeftEdge.points[0][0], magneticLeftEdge.points[0][1]],
        [x, y],
        [x, y + height],
      ];
      
      /**
       * Если у грани к которой магнитимся есть средняя точка
       * то добавляю и ее.
       */
      if (magneticLeftEdge.points[1]) {
        pointsToChoose.push([
          magneticLeftEdge.points[1][0], magneticLeftEdge.points[1][1]
        ]);
      }
      
      /**
       * Точки между которыми отрисуется указатель
       *
       * @type array
       */
      let points = findFarthestPoints(pointsToChoose);
      
      /**
       * Точки после сортировки.
       *
       * @type array
       */
      points = orderPoints(points[0], points[1]);
      
      props.edgesManager.addVerticalRail(
        points[0][0], points[0][1],
        points[1][0], points[1][1],
      );
    }
  }
  
  /**
   * Отрисовка указателя для правой грани области просмотра
   *
   * Если грань к которой примагничивается область имеет статус true в поле overall,
   * то будет отрисован указатель на всю высоту фрейма.
   * Статус overall = true имеют только грани фрейма.
   *
   * @param magneticRightEdge
   * @param x
   * @param y
   * @param width
   * @param height
   */
  const drawRightRail = (magneticRightEdge, x, y, width, height) => {
    if (magneticRightEdge.overall) {
      
      /**
       * Рисую указатель высотой на весь фрейм
       */
      props.edgesManager.addVerticalRail(
        magneticRightEdge.points[0][0], 0,
        magneticRightEdge.points[0][0], 100
      );
    } else {
      
      /**
       * Массив с точками граней.
       *
       * Две точки на грани к которой область магнитится и две точки
       * на грани самой области с правой стороны
       *
       * @type array
       */
      let pointsToChoose = [
        [magneticRightEdge.points[0][0], magneticRightEdge.points[0][1]],
        [x + width, y],
        [x + width, y + height],
      ];
      
      /**
       * Если у грани к которой магнитимся есть средняя точка
       * то добавляю и ее.
       */
      if (magneticRightEdge.points[1]) {
        pointsToChoose.push([
          magneticRightEdge.points[1][0], magneticRightEdge.points[1][1]
        ]);
      }
      
      /**
       * Точки между которыми отрисуется указатель
       *
       * @type array
       */
      let points = findFarthestPoints(pointsToChoose);
      
      /**
       * Точки после сортировки.
       *
       * @type array
       */
      points = orderPoints(points[0], points[1]);
      
      props.edgesManager.addVerticalRail(
        points[0][0], points[0][1],
        points[1][0], points[1][1],
      );
    }
  }
  
  /**
   * Отрисовка указателя для верхней грани области просмотра
   *
   * Если грань к которой примагничивается область имеет статус true в поле overall,
   * то будет отрисован указатель на всю высоту фрейма.
   * Статус overall = true имеют только грани фрейма.
   *
   * @param magneticTopEdge
   * @param x
   * @param y
   * @param width
   */
  const drawTopRail = (magneticTopEdge, x, y, width) => {
    if (magneticTopEdge.overall) {
      
      /**
       * Рисую указатель высотой на весь фрейм
       */
      props.edgesManager.addHorizontalRail(
        0, magneticTopEdge.points[0][1],
        100, magneticTopEdge.points[0][1]
      );
    } else {
      
      /**
       * Массив с точками граней.
       *
       * Две точки на грани к которой область магнитится и две точки
       * на грани самой области с верхней стороны
       *
       * @type array
       */
      let pointsToChoose = [
        [magneticTopEdge.points[0][0], magneticTopEdge.points[0][1]],
        [x, y],
        [x + width, y],
      ];
      
      /**
       * Если у грани к которой магнитимся есть средняя точка
       * то добавляю и ее.
       */
      if (magneticTopEdge.points[1]) {
        pointsToChoose.push([
          magneticTopEdge.points[1][0], magneticTopEdge.points[1][1]
        ]);
      }
      
      /**
       * Точки между которыми отрисуется указатель
       *
       * @type array
       */
      let points = findFarthestPoints(pointsToChoose);
      
      /**
       * Точки после сортировки.
       *
       * @type array
       */
      points = orderPoints(points[0], points[1]);
      
      props.edgesManager.addHorizontalRail(
        points[0][0], points[0][1],
        points[1][0], points[1][1],
      );
    }
  }
  
  /**
   * Отрисовка указателя для нижней грани области просмотра
   *
   * Если грань к которой примагничивается область имеет статус true в поле overall,
   * то будет отрисован указатель на всю высоту фрейма.
   * Статус overall = true имеют только грани фрейма.
   *
   * @param magneticBottomEdge
   * @param x
   * @param y
   * @param width
   * @param height
   */
  const drawBottomRail = (magneticBottomEdge, x, y, width, height) => {
    if (magneticBottomEdge.overall) {
      
      /**
       * Рисую указатель высотой на весь фрейм
       */
      props.edgesManager.addHorizontalRail(
        0, magneticBottomEdge.points[0][1],
        100, magneticBottomEdge.points[0][1]
      );
    } else {
      
      /**
       * Массив с точками граней.
       *
       * Две точки на грани к которой область магнитится и две точки
       * на грани самой области с нижней стороны
       *
       * @type array
       */
      let pointsToChoose = [
        [magneticBottomEdge.points[0][0], magneticBottomEdge.points[0][1]],
        [x, y + height],
        [x + width, y + height],
      ];
      
      /**
       * Если у грани к которой магнитимся есть средняя точка
       * то добавляю и ее.
       */
      if (magneticBottomEdge.points[1]) {
        pointsToChoose.push([
          magneticBottomEdge.points[1][0], magneticBottomEdge.points[1][1]
        ]);
      }
      
      /**
       * Точки между которыми отрисуется указатель
       *
       * @type array
       */
      let points = findFarthestPoints(pointsToChoose);
      
      /**
       * Точки после сортировки.
       *
       * @type array
       */
      points = orderPoints(points[0], points[1]);
      
      props.edgesManager.addHorizontalRail(
        points[0][0], points[0][1],
        points[1][0], points[1][1],
      );
    }
  }
  
  /**
   * Отрисовка вертикальных указателей
   *
   * Если так получается, что область находится в зоне притяжения
   * с левой и правой стороны, то здесь определяется какая сторона ближе
   * и там рисуется указатель, так как именно туда притянется область просмотра.
   *
   * @param magneticLeftEdge
   * @param magneticRightEdge
   * @param x
   * @param y
   * @param width
   * @param height
   */
  const drawVerticalRails = (magneticLeftEdge, magneticRightEdge, x, y, width, height) => {
    if (magneticLeftEdge !== null && magneticRightEdge !== null) {
      if (Math.abs(magneticLeftEdge.position - x) < Math.abs(magneticRightEdge.position - x - width)) {
        drawLeftRail(magneticLeftEdge, x, y, height);
      } else {
        drawRightRail(magneticRightEdge, x, y, width, height);
      }
    } else if (magneticLeftEdge !== null) {
      drawLeftRail(magneticLeftEdge, x, y, height);
    } else if (magneticRightEdge !== null) {
      drawRightRail(magneticRightEdge, x, y, width, height);
    }
  }
  
  /**
   * Отрисовка горизонтальных указателей
   *
   * Если так получается, что область находится в зоне притяжения
   * с верхней и нижней стороны, то здесь определяется какая сторона ближе
   * и там рисуется указатель, так как именно туда притянется область просмотра.
   *
   * @param magneticTopEdge
   * @param magneticBottomEdge
   * @param x
   * @param y
   * @param width
   * @param height
   */
  const drawHorizontalRails = (magneticTopEdge, magneticBottomEdge, x, y, width, height) => {
    if (magneticTopEdge !== null && magneticBottomEdge !== null) {
      if (Math.abs(magneticTopEdge.position - y) < Math.abs(magneticBottomEdge.position - y - height)) {
        drawTopRail(magneticTopEdge, x, y, width);
      } else {
        drawBottomRail(magneticBottomEdge, x, y, width, height);
      }
    } else if (magneticTopEdge !== null) {
      drawTopRail(magneticTopEdge, x, y, width);
    } else if (magneticBottomEdge !== null) {
      drawBottomRail(magneticBottomEdge, x, y, width, height);
    }
  }
  
  /**
   * Обработчик перемещения области просмотра с тормозящим декоратором
   */
  const drag = throttle((x, y) => {
    
    /**
     * Сбрасываю состояние указателей в EdgesManager
     *
     * @see EdgesManager
     */
    props.edgesManager.verticalRailSetted = false;
    props.edgesManager.horizontalRailSetted = false;
    
    /**
     * Получаю данные нужно ли магнититься сейчас к левой или правой стороне
     */
    let magneticLeftEdge  = props.edgesManager.checkVertical(leftEdgeKey, x);
    let magneticRightEdge = props.edgesManager.checkVertical(rightEdgeKey, x + width);
    
    /**
     * Сравниваю левую и правую грани к которым нужно магнититься, выбираю
     * ближайщую и записываю соответстующее положение области просмотра в переменную.
     */
    if (magneticLeftEdge !== null && magneticRightEdge !== null) {
      if (Math.abs(magneticLeftEdge.position - x) < Math.abs(magneticRightEdge.position - x - width)) {
        x = magneticLeftEdge.position;
      } else {
        x = magneticRightEdge.position - width;
      }
    } else if (magneticLeftEdge !== null) {
      x = magneticLeftEdge.position;
    } else if (magneticRightEdge !== null) {
      x = magneticRightEdge.position - width;
    }
    
    /**
     * Получаю данные нужно ли магнититься сейчас к верхней или нижней стороне
     */
    let magneticTopEdge    = props.edgesManager.checkHorizontal(topEdgeKey, y);
    let magneticBottomEdge = props.edgesManager.checkHorizontal(bottomEdgeKey, y + height);
    
    /**
     * Сравниваю верхнюю и нижнюю грани к которым нужно магнититься, выбираю
     * ближайщую и записываю соответстующее положение области просмотра в переменную.
     */
    if (magneticTopEdge !== null && magneticBottomEdge !== null) {
      if (Math.abs(magneticTopEdge.position - y) < Math.abs(magneticBottomEdge.position - y - height)) {
        y = magneticTopEdge.position;
      } else {
        y = magneticBottomEdge.position - height;
      }
    } else if (magneticTopEdge !== null) {
      y = magneticTopEdge.position;
    } else if (magneticBottomEdge !== null) {
      y = magneticBottomEdge.position - height;
    }
    
    /**
     * Рисую указатели.
     */
    drawVerticalRails(magneticLeftEdge, magneticRightEdge, x, y, width, height);
    drawHorizontalRails(magneticTopEdge, magneticBottomEdge, x, y, width, height);
    
    /**
     * Если вертикальный указатель не был отрисован то удаляю его из DOM дерева.
     */
    if (!props.edgesManager.verticalRailSetted) {
      props.edgesManager.removeVerticalRail();
    }
    
    /**
     * Если горизонтальный указатель не был отрисован то удаляю его из DOM дерева.
     */
    if (!props.edgesManager.horizontalRailSetted) {
      props.edgesManager.removeHorizontalRail();
    }
    
    /**
     * Выставляю новые позиции области просмотра.
     */
    setPositionX(x);
    setPositionY(y);
    
    /**
     * Обновляю положение граней области просмотра
     */
    updateVerticalEdges(x, y, width, height);
    updateHorizontalEdges(x, y, width, height);
  }, 10)
  
  /**
   * Обработчик ресайза левого края области просмотра с тормозящим декоратором
   */
  const leftResize = throttle((x, y, width, height) => {
    
    /**
     * Сбрасываю состояние указателя в EdgesManager.
     *
     * @see EdgesManager
     */
    props.edgesManager.verticalRailSetted = false;
    
    /**
     * Получаю данные нужно ли магнититься сейчас к левой стороне.
     */
    let magneticLeftEdge = props.edgesManager.checkVertical(leftEdgeKey, x);
    
    /**
     * Если нужно магнититься к грани, то обновляю позицию и размер области просмотра,
     * а затем отрисовываю указатель.
     */
    if (magneticLeftEdge !== null) {
      width -= magneticLeftEdge.position - x;
      x = magneticLeftEdge.position;
      drawLeftRail(magneticLeftEdge, x, y, height);
    }
    
    /**
     * Выставляю новые позиции и размер области просмотра.
     */
    setPositionX(x);
    setWidth(width);
    
    /**
     * Если вертикальный указатель не был отрисован то удаляю его из DOM дерева.
     */
    if (!props.edgesManager.verticalRailSetted) {
      props.edgesManager.removeVerticalRail();
    }
    
    /**
     * Обновляю положение граней области просмотра
     */
    updateVerticalEdges(x, y, width, height);
    updateHorizontalEdges(x, y, width, height);
  }, 10)
  
  /**
   * Обработчик ресайза правого края области просмотра с тормозящим декоратором
   */
  const rightResize = throttle((x, y, width, height) => {
    
    /**
     * Сбрасываю состояние указателя в EdgesManager
     *
     * @see EdgesManager
     */
    props.edgesManager.verticalRailSetted = false;
    
    /**
     * Получаю данные нужно ли магнититься сейчас к правой стороне.
     */
    let magneticRightEdge = props.edgesManager.checkVertical(rightEdgeKey, x + width);
    
    /**
     * Если нужно магнититься к грани, то обновляю позицию и размер области просмотра,
     * а затем отрисовываю указатель.
     *
     * При этом учитывается, что если при примагничиивании минимальная ширина
     * области просмотра будет нарушена то все отменяется.
     */
    if (magneticRightEdge !== null && (magneticRightEdge.position - x) > minAreaWidth) {
      width = magneticRightEdge.position - x;
      drawRightRail(magneticRightEdge, x, y, width, height);
    }
    
    /**
     * Выставляю новый размер области просмотра.
     */
    setWidth(width);
    
    /**
     * Если вертикальный указатель не был отрисован то удаляю его из DOM дерева.
     */
    if (!props.edgesManager.verticalRailSetted) {
      props.edgesManager.removeVerticalRail();
    }
    
    /**
     * Обновляю положение граней области просмотра
     */
    updateVerticalEdges(x, y, width, height);
    updateHorizontalEdges(x, y, width, height);
  }, 10)
  
  /**
   * Обработчик ресайза верхнего края области просмотра с тормозящим декоратором
   */
  const topResize = throttle((x, y, width, height) => {
    
    /**
     * Сбрасываю состояние указателя в EdgesManager
     *
     * @see EdgesManager
     */
    props.edgesManager.horizontalRailSetted = false;
    
    /**
     * Получаю данные нужно ли магнититься сейчас к верхней стороне
     */
    let magneticTopEdge = props.edgesManager.checkHorizontal(topEdgeKey, y);
    
    /**
     * Если нужно магнититься к грани, то обновляю позицию и размер области просмотра,
     * а затем отрисовываю указатель.
     */
    if (magneticTopEdge !== null) {
      height -= magneticTopEdge.position - y;
      y = magneticTopEdge.position;
      drawTopRail(magneticTopEdge, x, y, width);
    }
    
    /**
     * Выставляю новые позиции и размер области просмотра.
     */
    setPositionY(y);
    setHeight(height);
    
    /**
     * Если горизонтальный указатель не был отрисован то удаляю его из DOM дерева.
     */
    if (!props.edgesManager.horizontalRailSetted) {
      props.edgesManager.removeHorizontalRail();
    }
    
    /**
     * Обновляю положение граней области просмотра
     */
    updateVerticalEdges(x, y, width, height);
    updateHorizontalEdges(x, y, width, height);
  }, 10)
  
  /**
   * Обработчик ресайза нижнего края области просмотра с тормозящим декоратором
   */
  const bottomResize = throttle((x, y, width, height) => {
    
    /**
     * Сбрасываю состояние указателя в EdgesManager
     *
     * @see EdgesManager
     */
    props.edgesManager.horizontalRailSetted = false;
    
    /**
     * Получаю данные нужно ли магнититься сейчас к нижней стороне
     */
    let magneticBottomEdge = props.edgesManager.checkHorizontal(bottomEdgeKey, y + height);
    
    /**
     * Если нужно магнититься к грани, то обновляю позицию и размер области просмотра,
     * а затем отрисовываю указатель.
     *
     * При этом учитывается, что если при примагничиивании минимальная высота
     * области просмотра будет нарушена то все отменяется.
     */
    if (magneticBottomEdge !== null && (magneticBottomEdge.position - y) > minAreaHeight) {
      height = magneticBottomEdge.position - y;
      drawBottomRail(magneticBottomEdge, x, y, width, height);
    }
    
    /**
     * Выставляю новый размер области просмотра.
     */
    setHeight(height);
    
    /**
     * Если горизонтальный указатель не был отрисован то удаляю его из DOM дерева.
     */
    if (!props.edgesManager.horizontalRailSetted) {
      props.edgesManager.removeHorizontalRail();
    }
    
    /**
     * Обновляю положение граней области просмотра
     */
    updateVerticalEdges(x, y, width, height);
    updateHorizontalEdges(x, y, width, height);
  }, 10)
  
  /**
   * Обновление вертикальных граней области просмотра
   */
  const updateVerticalEdges = (x, y, width, height) => {
    props.edgesManager.updateVerticalEdge(leftEdgeKey, x, [
      [x, y],
      [x, y + height]
    ]);
    
    props.edgesManager.updateVerticalEdge(rightEdgeKey, x + width, [
      [x + width, y],
      [x + width, y + height]
    ]);
    
    props.edgesManager.updateVerticalEdge(verticalMiddleEdgeKey, x + width / 2, [
      [x + width / 2, y + height / 2]
    ]);
  }
  
  /**
   * Обновление горизонтальных граней области просмотра
   */
  const updateHorizontalEdges = (x, y, width, height) => {
    props.edgesManager.updateHorizontalEdge(topEdgeKey, y, [
      [x, y],
      [x + width, y]
    ]);
    
    props.edgesManager.updateHorizontalEdge(bottomEdgeKey, y + height, [
      [x, y + height],
      [x + width, y + height]
    ]);
    
    props.edgesManager.updateHorizontalEdge(horizontalMiddleEdgeKey, y + height / 2, [
      [x + width / 2, y + height / 2]
    ]);
  }
  
  /**
   * Добавляю грани для области просмотра
   *
   * 2 горизонтальных грани по краям и 1 по центру
   * 2 вертикальных грани по краям и 1 по центру
   *
   * @see EdgesManager ( подробнее о гранях )
   */
  useEffect(() => {
    setLeftEdgeKey(props.edgesManager.addVerticalEdge(
      props.left,
      [
        [props.left, props.top],
        [props.left, props.top + props.height]
      ]
    ));
    
    setRightEdgeKey(props.edgesManager.addVerticalEdge(
      props.left +props.width,
      [
        [props.left +props.width, props.top],
        [props.left +props.width, props.top + props.height]
      ]
    ));
    
    setVerticalMiddleEdgeKey(props.edgesManager.addVerticalEdge(
      props.left +props.width / 2,
      [
        [props.left +props.width / 2, props.top + props.height / 2]
      ]
    ));
    
    setTopEdgeKey(props.edgesManager.addHorizontalEdge(
      props.top,
      [
        [props.left, props.top],
        [props.left +props.width, props.top]
      ]
    ));
    
    setBottomEdgeKey(props.edgesManager.addHorizontalEdge(
      props.top + props.height,
      [
        [props.left, props.top + props.height],
        [props.left +props.width, props.top + props.height]
      ]
    ));
    
    setHorizontalMiddleEdgeKey(props.edgesManager.addHorizontalEdge(
      props.top + props.height / 2,
      [
        [props.left +props.width / 2, props.top + props.height / 2]
      ]
    ));
    
  }, []);
  
  /**
   * Удаляю грани для области просмотра при размонтировании.
   */
  useEffect(() => {
    return () => {
      props.edgesManager.deleteVerticalEdge(leftEdgeKey);
      props.edgesManager.deleteVerticalEdge(rightEdgeKey);
      props.edgesManager.deleteVerticalEdge(verticalMiddleEdgeKey);
      props.edgesManager.deleteHorizontalEdge(topEdgeKey);
      props.edgesManager.deleteHorizontalEdge(bottomEdgeKey);
      props.edgesManager.deleteHorizontalEdge(horizontalMiddleEdgeKey);
    }
  }, [leftEdgeKey, rightEdgeKey, verticalMiddleEdgeKey, topEdgeKey, bottomEdgeKey, horizontalMiddleEdgeKey]);
  
  useEffect(() => {
    function random() {
      let colorData = {
        alpha: _.random(0.25, 0.8, true),
        luminosity: 'light',
        format: 'rgba'
      }
  
      if (props.palette !== 'random') {
        colorData.hue = props.palette;
      }
      
      anime({
        targets:    ref.current,
        background: randomColor(colorData),
        easing:     'easeInOutQuad',
        duration:   _.random(200, 4000),
        complete:   random,
      });
    }
    
    random();
  }, []);
  
  return (
    <div
      className={'view-area'}
      style={{
        left:       positionX + '%',
        top:        positionY + '%',
        width:      width + '%',
        height:     height + '%',
        background: props.color,
      }}
      ref={ref}
      draggable={false}
    >
      <DragMask
        frame={props.frame} area={ref}
        x={positionX} y={positionY} onDrag={drag}
        edgesManager={props.edgesManager}
        save={saveViewAreaPosition}
      />
      <Resizer
        frame={props.frame} area={ref}
        x={positionX} y={positionY}
        width={width} height={height}
        onLeftResize={leftResize} onRightResize={rightResize}
        onBottomResize={bottomResize} onTopResize={topResize}
        minAreaWidth={minAreaWidth} minAreaHeight={minAreaHeight}
        edgesManager={props.edgesManager}
        save={saveViewAreaPosition}
      />
    </div>
  );
};
