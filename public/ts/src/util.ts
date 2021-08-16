import { mjElement, mjComponent, m, cc } from './mj.js';

// 每一页有多少条消息。注意：如果修改该数值，同时需要修改 database.go 中的 EveryPage
export const everyPage = 99;

// 找出第一个链接
export const httpRegex = /https?:\/\/[^\s,()!]+/;

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

export interface AjaxOptions {
  method: string;
  url: string;
  body?: FormData;
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

  xhr.send(options.body);
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