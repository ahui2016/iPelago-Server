import { mjElement, mjComponent, m, cc, span } from './mj.js';

// 每一页有多少条消息。注意：如果修改该数值，同时需要修改 database.go 中的 EveryPage
export const everyPage = 30;

// 找出第一个链接
const httpRegex = /https?:\/\/[^\s,()!]+/;
const tagLinkRegex = /#.+?#/;

export interface Island {
  ID: string;
  Name: string;
  Email: string;
  Avatar: string;
  Link: string;
  Note: string;
  Hide: boolean;
  Message: {
    time: number;
    body: string;
  } 
}

export interface Message {
  ID:       string;
	IslandID: string;
	Time:     number;
	Body:     string;
}

// 获取地址栏的参数。
export function getUrlParam(param: string): string {
  const queryString = new URLSearchParams(document.location.search);
  return queryString.get(param) ?? ''
}

export function disable(id: string): void {
  const nodeName = $(id).prop('nodeName');
  if (nodeName == 'BUTTON' || nodeName == 'INPUT') {
    $(id).prop('disabled', true);
  } else {
    $(id).css('pointer-events', 'none');
  }
}

export function enable(id: string): void {
  const nodeName = $(id).prop('nodeName');
  if (nodeName == 'BUTTON' || nodeName == 'INPUT') {
    $(id).prop('disabled', false);
  } else {
    $(id).css('pointer-events', 'auto');
  }
}

export interface mjAlerts extends mjComponent {
  insertElem: (elem: mjElement) => void;
  insert: (msgType: 'success' | 'danger' | 'info' | 'primary', msg: string) => void;
  clear: () => mjAlerts;
}

export function CreateAlerts(): mjAlerts {
  const alerts = cc('div') as mjAlerts;

  alerts.insertElem = (elem) => {
    $(alerts.id).prepend(elem);
  };

  alerts.insert = (msgType, msg) => {
    const time = dayjs().format('HH:mm:ss');
    const time_and_msg = `${time} ${msg}`;
    if (msgType == 'danger') {
      console.log(time_and_msg);
    }
    const elem = m('div')
      .addClass(`alert alert-${msgType} alert-dismissible fade show mt-1 mb-0`)
      .attr({role:'alert'})
      .append([
        m('span').text(time_and_msg),
        m('button').attr({type: 'button', class: "btn-close", 'data-bs-dismiss': "alert", 'aria-label':"Close"}),
      ]);
    alerts.insertElem(elem);
  };

  alerts.clear = () => {
    $(alerts.id).html('');
    return alerts;
  };

  return alerts;
}

export interface mjLoading extends mjComponent {
  hide: () => void;
  show: () => void;
}

export function CreateLoading(): mjLoading {
  const loading = cc('div', {classes:'text-center',children:[
    m('div').addClass('spinner-border').attr({role:'status'}).append(
      m('span').addClass('visually-hidden').text('Loading...'))]}
  ) as mjLoading;

  loading.hide = () => { loading.elem().hide() };
  loading.show = () => { loading.elem().show() };
  return loading;
}

export function CreateInfoPair(name: string, messages: mjElement): mjElement[] {
  const InfoMsg = cc('div', {id:'abount'+name+'msg',classes:'card text-dark bg-light my-3',children:[
    m('div').text(name).addClass('card-header'),
    m('div').addClass('card-body text-secondary').append(
      m('div').addClass('card-text').append(messages),
    ),
  ]});

  const infoBtn = m('button').addClass('btn btn-outline-dark').attr({title:'显示/隐藏'+name}).append(
    m('i').addClass('bi bi-info-circle'),
  ).on('click', () => { InfoMsg.elem().toggle() });

  return [infoBtn, m(InfoMsg)];
}

export interface AjaxOptions {
  method: string;
  url: string;
  body?: FormData | object;
  alerts?: mjAlerts;
  buttonID?: string;
  responseType?: XMLHttpRequestResponseType;
}

export function ajax(
  options: AjaxOptions,
  onSuccess: (resp: any) => void,
  onFail?: (errMsg: string) => void,
  onAlways?: (that: XMLHttpRequest) => void
): void {

  const handleErr = (errMsg: string) => {
    if (onFail) {
      onFail(errMsg);
      return;
    }
    if (options.alerts) {
      options.alerts.insert('danger', errMsg);
    } else {
      console.log(errMsg);
    }
  }

  if (options.buttonID) disable(options.buttonID);

  const xhr = new XMLHttpRequest();

  xhr.timeout = 10*1000;
  xhr.ontimeout = () => {
    handleErr('timeout');
  };

  if (options.responseType) {
    xhr.responseType = options.responseType;
  } else {
    xhr.responseType = 'json';
  }

  xhr.open(options.method, options.url);

  xhr.onerror = () => {
    handleErr('An error occurred during the transaction');
  };

  xhr.onload = function() {
    if (this.status == 200) {
      onSuccess(this.response);
    } else {
      let errMsg = `${this.status}`;
      if (this.responseType == 'text') {
        errMsg += ` ${this.responseText}`;
      } else {
        errMsg += ` ${this.response?.message!}`;
      }
      handleErr(errMsg);
    }
  };

  xhr.onloadend = function() {
    if (options.buttonID) enable(options.buttonID);
    if (onAlways) onAlways(this);
  };

  if (options.body && !(options.body instanceof FormData)) {
    const body = new FormData();
    for (const [k, v] of Object.entries(options.body)) {
      body.set(k, v);
    }
    xhr.send(body);
  } else {
    xhr.send(options.body);
  }
}

/**
 * @param n 超时限制，单位是秒
 */
export function ajaxPromise(options: AjaxOptions, n: number): Promise<any> {
  const second = 1000;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { reject('timeout') }, n*second);
    ajax(options,
      result => { resolve(result) },  // onSuccess
      errMsg => { reject(errMsg) },   // onError
      () => { clearTimeout(timeout) } // onAlways
    );
  });
}

function getLoginStatus(alerts?: mjAlerts): Promise<boolean> {
  return new Promise(resolve => {
    ajax({method:'GET',url:'/api/login-status',alerts:alerts},
      (isLoggedIn) => {
        resolve(isLoggedIn);
      });
  });
}

export function newFormData(name: string, value: string) {
  const fd = new FormData();
  fd.set(name, value);
  return fd;
}

export async function checkLogin(alerts?: mjAlerts): Promise<boolean> {
  const isLoggedIn = await getLoginStatus(alerts);
  if (isLoggedIn) {
    $('.onLoggedIn').show();
    $('.onLoggedOut').hide();
  } else {
    alerts?.insert('info', '需要用管理员密码登入后才能访问本页面');
    $('.onLoggedIn').hide();
    $('.onLoggedOut').show();
  }
  return isLoggedIn;
}

export const LoginArea = cc('div', { classes: 'text-center', children: [
  m('a').text('Login').attr({href:'/public/login.html'}),
]});

export function val(obj: mjElement | mjComponent): string {
  if ('elem' in obj) return obj.elem().val() as string
  return obj.val() as string
}

export function itemID(id: string): string {
  return `i${id}`;
}

export function contentsWithLinks(contents: string): string | mjElement[] {
  const httpLink = contents.match(httpRegex);
  if (!httpLink) {
    const tagLink = contents.match(tagLinkRegex);
    if (!tagLink) return contents;
    return addLinkToTag(contents);
  }

  const head = contents.substring(0, httpLink.index);
  const tail = contents.substring(httpLink.index! + httpLink[0].length);

  const headArr = addLinkToTag(head);
  if (headArr.length == 1) {
    var tailArr = addLinkToTag(tail);
  } else {
    var tailArr = [span(tail)];
  }
  
  return [
    ...headArr,
    m('a').addClass('link-dark').text(httpLink[0]).attr({href:encodeURI(httpLink[0]),target:'_blank'}),
    m('i').addClass('bi bi-box-arrow-up-right ms-1 text-secondary small'),
    ...tailArr,
  ];
}

function addLinkToTag(s: string): mjElement[] {
  const tagLink = s.match(tagLinkRegex);
  if (!tagLink) return [span(s)];

  const head = s.substring(0, tagLink.index);
  const tail = s.substring(tagLink.index! + tagLink[0].length);
  const url = '/public/search.html?pattern='+encodeURIComponent(tagLink[0]);
  return [
    span(head),
    m('a').addClass('link-dark').text(tagLink[0]).attr({href:url}),
    span(tail),
  ];
}