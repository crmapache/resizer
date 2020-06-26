import $ from 'jquery';

/**
 * Менеджер ребер к которым будут магнититься области просмотра.
 *
 * РЕБРА - виртуальные линии, к которым будут примагничиваться области просмотра.
 *
 * У каждого ребра есть поля n, points, overall
 * n      - положение ребра в процентах по оси X или Y
 * points - массив точек на этом ребре
 * overall - флаг который показывает, что при примагничивании к этому ребру нужно создавать
 * указатель на всю длинну или ширину
 *
 *
 * УКАЗАТЕЛЬ - линейка, которая создается при примагничивании к ребру, что бы показать
 * пользователю куда конкретно примагнитились.
 *
 * Указатели существуют только когда происходит перемещение или ресайз областей просмотра.
 * После они удаляются.
 *
 * Одновременно может быть только один вертикальный указатель и один горизонтальный.
 * Так как область одновременно магнитится только к какой то одной
 * вертикальной или горизонтальной стороне.
 *
 */
export default class EdgesManager {
  constructor(field) {
    
    /**
     * Здесь хранятся ребра.
     */
    this.verticalEdges = [];
    this.horizontalEdges = [];
    
    /**
     * Здесь хранятся указатели.
     */
    this.verticalRail = null;
    this.horizontalRail = null;
    
    /**
     * Показывает был ли установлен соответствующий указатель.
     * Это даст понять нужно ли его рисовать или нет.
     */
    this.verticalRailSetted = false;
    this.horizontalRailSetted = false;
    
    /**
     * Поле от размеров которого отталкиваюсь для рассчетов.
     * В нашем случае это frame.
     */
    this.field = field;
    
    /**
     * Дистанция в пикселях при которой области будут магнититься к ребрам.
     */
    this.magneticDistanceInPixels = 7;
  }
  
  /**
   * Установка вертикального ребра.
   *
   * Возвращает ключ этого ребра в массиве, по которому
   * потом его можно будет обновлять или удалять.
   *
   * @param n
   * @param points
   * @param overall
   * @returns {number}
   */
  addVerticalEdge = (n, points, overall = false) => {
    this.verticalEdges.push({position: n, points, overall});
    return this.verticalEdges.length - 1;
  }
  
  /**
   * Установка горизонтального ребра.
   *
   * Возвращает ключ этого ребра в массиве, по которому
   * потом его можно будет обновлять или удалять.
   *
   * @param n
   * @param points
   * @param overall
   * @returns {number}
   */
  addHorizontalEdge = (n, points, overall = false) => {
    this.horizontalEdges.push({position: n, points, overall});
    return this.horizontalEdges.length - 1;
  }
  
  /**
   * Обновление вертикального ребра.
   *
   * @param key
   * @param points
   */
  updateVerticalEdge = (key, n, points) => {
    this.verticalEdges[key].position = n;
    this.verticalEdges[key].points   = points;
  }
  
  /**
   * Обновление горизонтального ребра.
   *
   * @param key
   * @param points
   */
  updateHorizontalEdge = (key, n, points) => {
    this.horizontalEdges[key].position = n;
    this.horizontalEdges[key].points   = points;
  }
  
  /**
   * Удаление вертикального ребра по ключу.
   * @param key
   */
  deleteVerticalEdge = (key) => {
    delete this.verticalEdges[key];
  }
  
  /**
   * Удаление горизонтального ребра по ключу.
   * @param key
   */
  deleteHorizontalEdge = (key) => {
    delete this.horizontalEdges[key];
  }
  
  /**
   * Поиск ребер для примагничивания среди вертикальных ребер.
   *
   * Передается ключ ребра и выполняется поиск по другим ребрам.
   *
   * Если находятся совпадения то выбирается ближайшее.
   * Это важно для корректной работы.
   *
   * @param key
   * @param position
   * @returns {null}
   */
  checkVertical = (key, position) => {
    let match            = null;
    let magneticDistance = this._oneFieldPixelWidthInPercents() * this.magneticDistanceInPixels;
    
    for (let i in this.verticalEdges) {
      i = Number(i);
      const diff = Math.abs(this.verticalEdges[i].position - position);
      
      if (i !== key && diff <= magneticDistance) {
        if (match === null || diff < Math.abs(match.position - position)) {
          match = this.verticalEdges[i];
        }
      }
    }
    
    return match;
  }
  
  /**
   * Поиск ребер для примагничивания среди горизонтальных ребер.
   *
   * Передается ключ ребра и выполняется поиск по другим ребрам.
   *
   * Если находятся совпадения то выбирается ближайшее.
   * Это важно для корректной работы.
   *
   * @param key
   * @param position
   * @returns {null}
   */
  checkHorizontal = (key, position) => {
    let match            = null;
    let magneticDistance = this._oneFieldPixelHeightInPercents() * this.magneticDistanceInPixels;
    
    for (let i in this.horizontalEdges) {
      i = Number(i);
      const diff = Math.abs(this.horizontalEdges[i].position - position);
      
      if (i !== key && diff <= magneticDistance) {
        if (match === null || diff < Math.abs(match.position - position)) {
          match = this.horizontalEdges[i];
        }
      }
    }
    
    return match;
  }
  
  /**
   * Отрисовка вертикального указателя по двум точкам.
   *
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   */
  addVerticalRail = (x1, y1, x2, y2) => {
    let left            = x1 + '%';
    
    if (x1 > 100 - this._oneFieldPixelHeightInPercents()) {
      left            = `calc(100% - ${2}px)`;
    }
    
    if (this.verticalRail !== null) {
      this.verticalRail.node.css({
        top:       y1 + '%',
        left,
        bottom:    (100 - y2) + '%',
      });
      
      this.verticalRail = {x1, y1, x2, y2, node: this.verticalRail.node}
    } else {
      let node = $('<div>').addClass('rail vertical-rail').css({
        top:       y1 + '%',
        left,
        bottom:    (100 - y2) + '%',
      });
      
      $('.rails').append(node);
      
      this.verticalRail = {x1, y1, x2, y2, node}
    }
    
    this.verticalRailSetted = true;
  }
  
  /**
   * Удаление вертикального указателя.
   */
  removeVerticalRail = () => {
    if (this.verticalRail !== null) {
      this.verticalRail.node.detach();
      this.verticalRail = null;
    }
  }
  
  /**
   * Отрисовка горизонтального указателя по двум точкам.
   *
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   */
  addHorizontalRail = (x1, y1, x2, y2) => {
    let top             = y1 + '%';
    
    if (y1 > 100 - this._oneFieldPixelWidthInPercents()) {
      top             = `calc(100% - ${1}px)`;
    }
    
    if (this.horizontalRail !== null) {
      this.horizontalRail.node.css({
        top,
        left:      x1 + '%',
        right:     (100 - x2) + '%',
      });
      
      this.horizontalRail = {x1, y1, x2, y2, node: this.horizontalRail.node}
    } else {
      
      let node = $('<div>').addClass('rail horizontal-rail').css({
        top,
        left:      x1 + '%',
        right:     (100 - x2) + '%',
      });
      
      $('.rails').append(node);
      
      this.horizontalRail = {x1, y1, x2, y2, node}
    }
    
    this.horizontalRailSetted = true;
  }
  
  /**
   * Удаление горизонтального указателя.
   */
  removeHorizontalRail = () => {
    if (this.horizontalRail !== null) {
      this.horizontalRail.node.detach();
      this.horizontalRail = null;
    }
  }
  
  /**
   * Удаление вертикального и горизонтального указателя.
   */
  removeRails = () => {
    this.removeVerticalRail();
    this.removeHorizontalRail();
  }
  
  /**
   * Получение размера одного пикселя ширины поля в процентах.
   *
   * @returns float
   * @private
   */
  _oneFieldPixelWidthInPercents = () => {
    return 1 / (this.field.getBoundingClientRect().width / 100);
  }
  
  /**
   * Получение размера одного пикселя высоты поля в процентах.
   *
   * @returns float
   * @private
   */
  _oneFieldPixelHeightInPercents = () => {
    return 1 / (this.field.getBoundingClientRect().height / 100);
  }
}