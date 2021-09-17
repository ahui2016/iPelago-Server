import { mjComponent, m, cc, span, appendToListAsync } from './mj.js';
import * as util from './util.js';

const allIslands = new Map<string, util.Island>();
let lastTime = dayjs().unix();
let isNewSearch = true;
let pattern = util.getUrlParam('pattern');

const Alerts = util.CreateAlerts();
const Loading = util.CreateLoading();

const titleArea = m('div').addClass('my-5 text-center').append([
  m('div').addClass('display-4').append([
    m('span').text('Search'),
    m('a').attr({href:'/public/dashboard.html',title:'dashboard'}).addClass('btn btn-sm btn-outline-dark ms-1').append(
      m('i').addClass('bi bi-gear')
    ),  
  ]),
]);

const MsgList = cc('div', {classes:'vstack gap-5'});

const SearchInput = cc('input', {classes:'form-control'});
const SearchBtn = cc('button', {classes:'btn btn-outline-primary'});
const SearchForm = cc('form', {classes:'input-group my-5',children:[
  m(SearchInput),
  m(SearchBtn).text('Search').on('click', event => {
    event.preventDefault();
    isNewSearch = true;
    lastTime = dayjs().unix();
    MsgList.elem().html('');
    pattern = util.val(SearchInput).trim();
    if (pattern.length < 2) {
      Alerts.insert('info', '搜索内容太短 (至少需要 2 个字符)');
      SearchInput.elem().trigger('focus');
      return;
    }
    search();
  }),
]});

const MoreBtn = cc('button', {classes:'btn btn-outline-secondary'});
const MoreBtnArea = cc('div', {classes:'text-center my-5',children:[
  m(MoreBtn).text('More').on('click', search),
]});

const BottomLine = cc('div', {classes:'text-center fw-light small text-secondary my-5', children:[
  m('a').text('Back to Timeline').addClass('link-secondary').attr({href:'/public/index.html'}),
]});

$('#root').append([
  titleArea,
  m(SearchForm).addClass('onLoggedIn'),
  m(MsgList).addClass('my-5'),
  m(Alerts).addClass('my-5'),
  m(Loading).addClass('my-5'),
  m(MoreBtnArea).hide(),
  m(BottomLine),
  m(util.LoginArea).addClass('onLoggedOut my-5').hide(),
]);

init();

async function init() {
  const isLoggedIn = await util.checkLogin();
  if (!isLoggedIn) {
    Alerts.insert('info', '需要用管理员密码登入后才能使用搜索功能');
    Loading.hide();
    return;
  }

  Loading.hide();
  setTimeout(() => {
    // SearchInput.elem().trigger('focus');
    console.log('pattern:', pattern);
    
    if (pattern) {
      SearchInput.elem().val(pattern);
      SearchBtn.elem().trigger('click');
    }
  }, 300);
}

function search(): void {
  if (isNewSearch) {
    MoreBtnArea.elem().show();
    var notFoundMsg = `找不到 [${pattern}]`;
    isNewSearch = false;
  } else {
    var notFoundMsg = '没有更多相关消息了';
  }
  Loading.show();
  Alerts.insert('primary', `searching [${pattern}]...`);
  const body = util.newFormData('time', lastTime.toString());
  body.set('pattern', pattern);
  util.ajax({method:'POST',url:'/admin/search-messages',alerts:Alerts,body:body},
    async (resp) => {
      const messages = resp as util.Message[];
      if (!messages || messages.length == 0) {
        MoreBtnArea.elem().hide();
        Alerts.insert('info', notFoundMsg);
        return;
      }
      Alerts.clear();
      if (messages.length < util.everyPage) {
        MoreBtnArea.elem().hide();
      }
      await appendToListAsync(MsgList, messages.map(MsgItem));
      lastTime = messages[messages.length-1].Time;
    }, errMsg => {
      if (errMsg.substr(0, 3) == '401') {
        location.reload();
      } else {
        Alerts.insert('danger', errMsg);
      }
    }, () => {
      Loading.hide();
    });
}

function MsgItem(msg: util.Message): mjComponent {
  const MsgAlerts = util.CreateAlerts();
  const datetime = dayjs.unix(msg.Time).format('YYYY-MM-DD HH:mm:ss');
  const islandPage = '/public/island-messages.html?id='+msg.IslandID;

  const self = cc('div', {id:util.itemID(msg.ID), classes:'d-flex justify-content-start align-items-start MsgItem', children:[
    m('a').attr({href:islandPage}).append(
      m('img').addClass('Avatar').attr({src:'/public/avatar-default.jpg'})
    ),
    m('div').addClass('ms-3 flex-fill').append([
      m('div').addClass('Name'),
      m('div').addClass('Contents fs-5').attr({title:datetime}),
      m(MsgAlerts),
    ]),
  ]});

  self.init = async () => {
    const island = await getIsland(msg.IslandID, MsgAlerts);
    if (!island) return;

    if (island.Avatar) {
      self.elem().find('.Avatar').attr({src:island.Avatar});
    }

    const NameElem = self.elem().find('.Name');
    NameElem.append(
      m('a').text(island.Name).attr({href:islandPage}).addClass('text-decoration-none link-dark fw-bold')
    );
    if (island.Email) {
      NameElem.append(
        m('span').text(island.Email).addClass('small text-muted ms-1')
      );
    }

    const contentsElem = $(self.id).find('.Contents');
    const contents = util.contentsWithLinks(msg.Body);
    if (typeof contents == 'string') {
      contentsElem.text(contents);
    } else {
      contentsElem.append(contents);
    }
  };
  return self;
}

async function getIsland(id: string, alerts: util.mjAlerts) {
  try {
    let island = allIslands.get(id);
    if (island) return island;
    island = await getIslandByID(id);
    allIslands.set(id, island);
    return island;
  } catch (err) {
    alerts.insert('danger', err as string);
  }
}

function getIslandByID(id: string): Promise<util.Island> {
  const body = util.newFormData('id', id);
  return new Promise((resolve, reject) => {
    util.ajax({method:'POST',url:'/admin/get-island',body:body},
      (island) => {
        resolve(island);
      }, (errMsg) => {
        reject(errMsg);
      });
  });
}
