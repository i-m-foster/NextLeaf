/* *** Code Inconsistent with Rappid Distribution ***/

joint.shapes.basic.Intention = joint.shapes.basic.Generic.extend({
    // Changed satvalue to text
    markup: '<g class="rotatable"><g class="scalable"><rect class="outer"/></g><text class="satvalue"/><text class="funcvalue"/><text class="name"/></g>',
    defaults: joint.util.deepSupplement({
        type: "basic.Intention",
        size: {
            width: 100,
            height: 60
        },
        attrs: {
            ".outer": {
                width: 100,
                height: 60
            },
            // Navie: Changed the initial value of satvalue
            ".satvalue": {
                'stroke': '#000000',
                'stroke-width': 0.5,
                'font-size': 12,
                'text-anchor': 'middle',
                'value': 'none'
            },
            ".funcvalue": {
                'text': "",
                'ref-y': '0.75',
                'ref-x': '0.08',
                'fill': 'black',
                'font-size': 16
            },
            ".name": {
                'fill': 'black',
                'ref-y': '0.5',
                'ref-x': '0.5',
                'font-size': 10,
                'x-alignment': 'middle',
                'y-alignment': 'middle'
            }
        }
    }, joint.dia.Element.prototype.defaults)
});

joint.shapes.basic.Goal = joint.shapes.basic.Intention.extend({
    defaults: joint.util.deepSupplement({
        type: "basic.Goal",
        attrs: {
            ".outer": {
                rx: 20,
                ry: 20,
                stroke: 'black',
                fill: '#FFCC66',
            },
            ".satvalue": {
                'ref-x': '0.75',
                'ref-y': '0.75'
            },
            ".name": {
                'text': 'Goal',
            }
        }
    }, joint.shapes.basic.Intention.prototype.defaults),
    changeToOriginalColour: function () {
        this.attr({ '.outer': { 'fill': '#FFCC66' } });
    }
});

joint.shapes.basic.Task = joint.shapes.basic.Intention.extend({
    markup: '<g class="rotatable"><g class="scalable"><path class="outer"/></g><text class="satvalue"/><text class="funcvalue"/><text class="name"/></g>',
    defaults: joint.util.deepSupplement({
        type: "basic.Task",
        attrs: {
            ".outer": {

                refD: 'M 0 30 L 20 0 L 80 0 L 100 30 L 80 60 L 20 60 z',
                fill: '#92E3B1',
                stroke: 'black',
                'stroke-width': 1
            },
            ".satvalue": {
                'ref-y': '0.75',
                'ref-x': '0.8',
            },
            ".funcvalue": {
                'ref-y': '0.75',
                'ref-x': '0.2',
            },
            ".name": {
                'text': 'Task',
            }
        }
    }, joint.shapes.basic.Intention.prototype.defaults),
    changeToOriginalColour: function () {
        this.attr({ '.outer': { 'fill': '#92E3B1' } });
    }
});

joint.shapes.basic.Softgoal = joint.shapes.basic.Intention.extend({
    markup: '<g class="rotatable"><g class="scalable"><path class="outer"/></g><text class="satvalue"/><text class="funcvalue"/><text class="name"/></g>',
    defaults: joint.util.deepSupplement({
        type: "basic.Softgoal",
        attrs: {
            ".outer": {
                refD: 'M 0 30 Q 5 0 45 15 Q 55 18 65 15 Q 95 5 100 25 L 100 40 Q 100 60 80 60 L 75, 60 Q 66 59 55 56 Q 45 52 35 56 Q 25 57 15 58 L 10 58 Q 0 53 0 35 z',
                stroke: 'black',
                fill: '#FF984F',
            },
            ".satvalue": {
                'ref-y': '0.75',
                'ref-x': '0.76'
            },
            ".funcvalue": {
                'ref-y': '0.75',
                'ref-x': '0.2',
            },
            ".name": {
                'text': 'Soft Goal',
            }
        }
    }, joint.shapes.basic.Intention.prototype.defaults),
    changeToOriginalColour: function () {
        this.attr({ '.outer': { 'fill': '#FF984F' } });
    }
});

joint.shapes.basic.Resource = joint.shapes.basic.Intention.extend({
    defaults: joint.util.deepSupplement({
        type: "basic.Resource",
        attrs: {
            ".outer": {
                stroke: 'black',
                fill: '#92C2FE',
            },
            ".satvalue": {
                transform: "translate(80, 45)",
            },
            ".name": {
                'text': 'Resource',
            }
        }
    }, joint.shapes.basic.Intention.prototype.defaults),
    changeToOriginalColour: function () {
        this.attr({ '.outer': { 'fill': '#92C2FE' } });
    }
});

joint.dia.Actorlink = joint.dia.Link.extend({
    defaults: joint.util.deepSupplement({
        type: 'Actorlink',
    })
})

joint.shapes.basic.Actor = joint.shapes.basic.Generic.extend({
    markup: '<g class="scalable"><circle class = "outer"/></g><circle class="label"/><path class="line"/><text class = "name"/>',
    defaults: joint.util.deepSupplement({
        type: "basic.Actor",
        size: {
            width: 120,
            height: 120
        },
        attrs: {
            ".label": {
                r: 30,
                cx: 30,
                cy: 30,
                fill: '#FFFFA4',
                stroke: '#000000'
            },
            ".outer": {
                r: 60,
                cx: 60,
                cy: 60,
                fill: '#EBFFEA', //'#CCFFCC',
                stroke: '#000000',
                'stroke-dasharray': '5 2'
            },

            ".name": {
                'text': 'Actor',
                'fill': 'black',
                'ref-y': '0.5',
                'ref-x': '0.5',
                'ref': '.label',
                'font-size': 10,
                'x-alignment': 'middle',
                'y-alignment': 'middle'
            },
            ".line": {
            }
        }
    }, joint.dia.Element.prototype.defaults),
    changeToOriginalColour: function () {
        this.attr({ '.outer': { 'fill': '#EBFFEA' } });
    }
});