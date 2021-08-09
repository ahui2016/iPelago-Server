
export type mjElement = JQuery<HTMLElement>;

export interface mjComponent {
  id: string;
  raw_id: string;
  view: mjElement;
  elem: () => JQuery<HTMLElement>;
  init?: () => void;
}

/** 
 * 函数名 m 来源于 Mithril, 也可以理解为 make 的简称，用来创建一个元素。
 */
export function m(name: string | mjComponent): mjElement {
  if (typeof name == 'string') {
    return $(document.createElement(name));
  }
  return name.view;
}

interface ComponentOptions {
  id?:       string;
  children?: mjElement[]; 
  classes?:  string;
  attr?:     {[index: string]:any};
}

function newComponent(name: string, id: string): mjComponent {
  return {
    id: '#'+id,
    raw_id: id,
    view: m(name).attr('id', id),
    elem: () => $('#'+id)
  };
}

/**
 * 函数名 cc 意思是 create a component, 用来创建一个简单的组件。
 */
export function cc(name: string, options?: ComponentOptions): mjComponent {
  let id = `r${Math.round(Math.random() * 100000000)}`;

  // 如果没有 options
  if (!options) {
    return newComponent(name, id);
  }
  // 后面就可以默认有 options

  if (options.id) id = options.id;
  const component = newComponent(name, id);

  if (options.attr)     component.view.attr(options.attr);
  if (options.classes)  component.view.addClass(options.classes);
  if (options.children) component.view.append(options.children);
  return component;
}

/**
 * 函数名 mt 意思是 make a text element, 用来创建一个纯文本元素。
 */
 export function mt(text: string): Text {
  return document.createTextNode(text);
}