import WysiwygEditor from '../src/js/wysiwygEditor';
import EventManager from '../src/js/eventManager';
import WwListManager from '../src/js/wwListManager';

describe('WwListManager', () => {
    let $container, em, wwe, mgr;

    beforeEach(() => {
        $container = $('<div />');

        $('body').append($container);

        em = new EventManager();

        wwe = new WysiwygEditor($container, em);

        wwe.init();

        mgr = new WwListManager(wwe);
    });

    //we need to wait squire input event process
    afterEach(done => {
        setTimeout(() => {
            $('body').empty();
            done();
        });
    });

    describe('Event', () => {
        it('wysiwygSetValueAfter: wrap list inner to div after setValue', () => {
            const html = '<ul><li>test</li></ul>';
            wwe.setValue(html);

            expect(wwe.get$Body().find('li div').length).toEqual(1);
            expect(wwe.get$Body().find('li div').text()).toEqual('test');
        });
    });

    describe('_findAndRemoveEmptyList()', () => {
        it('remove ul that without li element within.', () => {
            wwe.setValue(['<ul>this will deleted</ul>',
                '<ol>and this too</ol>'].join(''));

            expect(wwe.get$Body().find('ul').length).toEqual(1);
            expect(wwe.get$Body().find('ol').length).toEqual(1);

            mgr._findAndRemoveEmptyList();

            expect(wwe.get$Body().find('ul').length).toEqual(0);
            expect(wwe.get$Body().find('ol').length).toEqual(0);
        });
        it('do not remove when ul have li element within.', () => {
            wwe.setValue([
                '<ul>',
                '<li><div>survived!</div></li>',
                '</ul>',
                '<ol>',
                '<li><div>me too!</div></li>',
                '</ol>'].join(''));

            expect(wwe.get$Body().find('ul').length).toEqual(1);
            expect(wwe.get$Body().find('ol').length).toEqual(1);

            mgr._findAndRemoveEmptyList();

            expect(wwe.get$Body().find('ul').length).toEqual(1);
            expect(wwe.get$Body().find('ul li').text()).toEqual('survived!');
            expect(wwe.get$Body().find('ol li').text()).toEqual('me too!');
        });
    });

    describe('_removeBranchListAll', () => {
        it('Remove all branch list', () => {
            wwe.getEditor().setHTML([
                '<ul>',
                '<li>',
                '<div>t1<br></div>',
                '<ul>',
                '<li>',
                '<ul>',
                '<li>',
                '<div>t2<br></div>',
                '<ul>',
                '<li><div>t3<br></div></li>',
                '<li><div>t4<br></div></li>',
                '</ul>',
                '</li>',
                '</ul>',
                '</li>',
                '<li><div>t5</div></li>',
                '</ul>',
                '</li>',
                '</ul>'].join(''));
            mgr._removeBranchListAll();

            expect(wwe.get$Body().find('ul').length).toEqual(3);
            expect(wwe.get$Body().find('ul li ul').eq(0).children('li').length).toEqual(2);
            expect(wwe.get$Body().find('ul li ul').eq(0).children('li').eq(0).children('div').text()).toEqual('t2');
            expect(wwe.get$Body().find('ul li ul').eq(0).children('li').eq(1).text()).toEqual('t5');
        });

        it('Dont break to contentEditable root body', () => {
            wwe.getEditor().setHTML([
                '<div>',
                '<ul>',
                '<li>',
                '<ul>',
                '<li><div>t1<br></div></li>',
                '<li><div>t1<br></div></li>',
                '<li><div>t1<br></div></li>',
                '</ul>',
                '</li>',
                '<li><div>t2</div></li>',
                '</ul>',
                '</div>'].join(''));

            mgr._removeBranchListAll();

            expect(wwe.get$Body().find('ul').length).toEqual(1);
            expect(wwe.get$Body().find('ul li ul').eq(0).children('li').length).toEqual(0);
            expect(wwe.get$Body().children('div').length).toEqual(1);
        });

        it('Dont remove correct list with text node', () => {
            wwe.getEditor().setHTML([
                '<ul>',
                '<li>',
                't1',
                '<ul>',
                '<li><div>t3<br></div></li>',
                '<li><div>t4<br></div></li>',
                '</ul>',
                '</li>',
                '</ul>'].join(''));
            mgr._removeBranchListAll();

            expect(wwe.get$Body().find('ul').length).toEqual(2);
            expect(wwe.get$Body().find('ul li ul').eq(0).children('li').length).toEqual(2);
            expect(wwe.get$Body().find('ul li ul').eq(0).children('li').eq(0).children('div').text()).toEqual('t3');
            expect(wwe.get$Body().find('ul li ul').eq(0).children('li').eq(1).text()).toEqual('t4');
        });
    });

    describe('Control list blank line', () => {
        it('ul - br - ul', () => {
            const html = [
                '<ul>',
                '<li><div>1</div></li>',
                '</ul>',
                '<br />',
                '<ul>',
                '<li><div>2</div></li>',
                '</ul>'
            ].join('');

            const result = mgr._prepareInsertBlankToBetweenSameList(html);

            expect(result.indexOf(':BLANK_LINE:')).not.toBe(-1);
            expect(result.indexOf('<br />')).toBe(-1);
        });

        it('ul - br - br - ul', () => {
            const html = [
                '<ul>',
                '<li><div>1</div></li>',
                '</ul>',
                '<br />',
                '<br />',
                '<ul>',
                '<li><div>2</div></li>',
                '</ul>'
            ].join('');

            const result = mgr._prepareInsertBlankToBetweenSameList(html);

            expect(result.indexOf(':BLANK_LINE:')).not.toBe(-1);
            expect(result.indexOf('<br />')).toBe(-1);
        });

        it('ul - ul', () => {
            const html = [
                '<ul>',
                '<li><div>1</div></li>',
                '</ul>',
                '<ul>',
                '<li><div>2</div></li>',
                '</ul>'
            ].join('');

            const result = mgr._prepareInsertBlankToBetweenSameList(html);

            expect(result.indexOf(':BLANK_LINE:')).not.toBe(-1);
            expect(result.indexOf('<br />')).toBe(-1);
        });
    });
    describe('_wrapDefaultBlockToListInner', () => {
        it('Wrap default blocks to list top inline nodes', () => {
            wwe.getEditor().setHTML([
                '<ul>',
                '<li>',
                't1<br>',
                '<ul><li>t2<br></li></ul>',
                '</li>',
                '</ul>'].join(''));

            mgr._wrapDefaultBlockToListInner();

            expect(wwe.get$Body().find('div').length).toEqual(2);
            expect(wwe.get$Body().find('div').eq(0).text()).toEqual('t1');
            expect(wwe.get$Body().find('div').eq(1).text()).toEqual('t2');
        });
    });
});
