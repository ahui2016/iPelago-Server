import dayjs from 'dayjs';
import { mjElement, mjComponent, m, cc } from './mj';

// 获取地址栏的参数。
export function getUrlParam(param: string): string | null {
  let queryString = new URLSearchParams(document.location.search);
  return queryString.get(param);
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
  insert: (msgType: string, msg: string) => void;
  clear: () => void;
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
  };

  return alerts;
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

  if (options.responseType) {
    xhr.responseType = options.responseType;
  } else {
    xhr.responseType = 'json';
  }

  xhr.open(options.method, options.url);

  xhr.onerror = () => {
    const errMsg = 'An error occurred during the transaction';
    handleErr(errMsg);
  };

  xhr.addEventListener('load', function() {
    if (this.status == 200) {
      onSuccess(this.response);
    } else {
      const errMsg = `${this.status}` + this.responseText + this.response!.message!;
      handleErr(errMsg);
    }
  });

  xhr.addEventListener('loadend', function() {
    if (options.buttonID) enable(options.buttonID);
    if (onAlways) onAlways(this);
  });

  xhr.send(options.body);
}
