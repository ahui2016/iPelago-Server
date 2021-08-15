import { m, cc, span, appendToList } from './mj.js';
import * as util from './util.js';
const allIslands = new Map();
let lastTime = dayjs().unix();
const Alerts = util.CreateAlerts();
const Loading = util.CreateLoading();
const title = m('div').text('Timeline').addClass('display-4 my-5 text-center');
const MsgList = cc('ul', { classes: 'list-group list-group-flush' });
const MoreBtn = cc('button', { classes: 'btn btn-outline-secondary' });
const MoreBtnArea = cc('div', { classes: 'text-center my-5', children: [
        m(MoreBtn).text('More').on('click', getPublicMessages),
    ] });
$('#root').append([
    title,
    m(MsgList),
    m(Alerts),
    m(Loading).addClass('my-5'),
    m(MoreBtnArea).hide(),
    m(util.LoginArea).addClass('onLoggedOut'),
]);
init();
async function init() {
    const isLoggedIn = await util.checkLogin(Alerts);
    if (!isLoggedIn)
        return;
    getPublicMessages();
}
function getPublicMessages() {
    Loading.show();
    const body = util.newFormData('time', lastTime.toString());
    util.ajax({ method: 'POST', url: '/api/more-public-messages', alerts: Alerts, body: body }, (resp) => {
        const messages = resp;
        if (!messages || messages.length == 0) {
            Alerts.insert('primary', '没有更多消息了');
            MoreBtnArea.elem().hide();
            return;
        }
        if (messages.length < util.everyPage) {
            MoreBtnArea.elem().hide();
        }
        appendToList(MsgList, messages.map(MsgItem));
        lastTime = messages[messages.length - 1].Time;
    }, undefined, () => {
        Loading.hide();
    });
}
function MsgItem(msg) {
    const MsgAlerts = util.CreateAlerts();
    const datetime = dayjs.unix(msg.Time).format('YYYY-MM-DD HH:mm:ss');
    const self = cc('div', { id: util.itemID(msg.ID), classes: 'list-group-item d-flex justify-content-start align-items-start MsgItem mb-3', children: [
            m('a').addClass('AvatarLink').append(m('img').addClass('Avatar')),
            m('div').addClass('ms-3 flex-fill').append([
                m('div').addClass('Nmae'),
                m('div').addClass('Contents'),
                m('div').addClass('Datetime small text-muted text-end').text(datetime),
                m(MsgAlerts),
            ]),
        ] });
    self.init = async () => {
        const island = await getIsland(msg.IslandID, MsgAlerts);
        if (!island)
            return;
        let avatar = '/public/avatar-default.jpg';
        if (island.Avatar)
            avatar = island.Avatar;
        const islandPage = '/public/island-messages.html?id=' + msg.IslandID;
        self.elem().find('.AvatarLink').attr({ href: islandPage });
        self.elem().find('.Avatar').attr({ src: avatar, alt: 'avatar' });
        const NameElem = self.elem().find('.Name');
        NameElem.append(m('a').text(island.Name).attr({ href: islandPage }).addClass('text-decoration-none'));
        if (island.Email) {
            NameElem.append(m('span').text(island.Email).addClass('small text-muted ms-1'));
        }
        const contentsElem = $(self.id).find('.Contents');
        const httpLink = msg.Body.match(util.httpRegex);
        if (!httpLink) {
            contentsElem.text(msg.Body);
        }
        else if (httpLink.index) {
            contentsElem.append([
                span(msg.Body.substring(0, httpLink.index)),
                m('a').text(httpLink[0]).attr({ href: httpLink[0], target: '_blank' }),
                span(msg.Body.substring(httpLink.index + httpLink[0].length)),
            ]);
        }
    };
    return self;
}
async function getIsland(id, alerts) {
    let island = allIslands.get(id);
    if (island)
        return island;
    try {
        island = await getIslandByID(id);
        allIslands.set(id, island);
        return island;
    }
    catch (err) {
        alerts.insert('danger', err);
    }
}
function getIslandByID(id) {
    const body = util.newFormData('id', id);
    return new Promise((resolve, reject) => {
        util.ajax({ method: 'GET', url: '/api/get-island/', body: body }, (island) => {
            resolve(island);
        }, (errMsg) => {
            reject(errMsg);
        });
    });
}
