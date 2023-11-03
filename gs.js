// prios is list of list of (idx, pref)
function EGS(priosM, priosW) {
    let n = priosM.length;
    let free = [];
    for (let i = 0; i < n; i++) {
        free.push(i);
        priosM[i].sort((v1,v2) => v1[1] - v2[1]); // sort ASCending by pref (best first)
        priosW[i].sort((v1,v2) => v2[1] - v1[1]); // sort DESCending by prio (worst first)
    }

    let pairs = {};

    while (free.length > 0) {
        let m = free.shift();
        let [w, _] = priosM[m].shift();

        pairs[m] = w;

        for (let [m2,w2] of Object.entries(pairs)) {
            if (w2 != w || m2 == m) continue;
            free.push(m2);
            delete pairs[m2];
        }

        // remove m's successors in prios of w
        while (priosW[w][0][0] != m) {
            let m2 = priosW[w].shift()[0]; // remove weaker prio from w
            priosM[m2] = priosM[m2].filter((p) => p[0] != w) // remove stronger prio from m
        }
    }

    return pairs;
}

// ----------------
//       DOM
// ----------------

class OptionList {

    div;
    ul;
    onRemove = (x) => {};
    onAdd = (x) => {};

    constructor() {
        this.div = document.createElement("div");
        this.div.classList.add("option-list");
        this.ul = document.createElement("ul");
        this.input = document.createElement("input");
        this.input.classList.add("option-list-input");
        this.div.appendChild(this.input);
        this.div.appendChild(this.ul);

        this.input.placeholder = "Enter a new option here ...";
        this.input.addEventListener("keydown", (ev) => {
            if (ev.key == "Enter" && ev.target.value.trim() != "") {
                // check if already exists
                this._addOption(ev.target.value);
                ev.target.value = "";
            }
        });
    }

    getEl() {
        return this.div;
    }

    _addOption(opt) {
        let li = this.ul.appendChild(document.createElement("li"));
        let spanName = li.appendChild(document.createElement("span"));
        let delBtn = li.appendChild(document.createElement("span"));
        spanName.innerText = opt;
        delBtn.classList.add("delete-btn");

        delBtn.addEventListener("click", (ev) => {
            this.ul.removeChild(li);
            this.onRemove(opt);
        });

        this.onAdd(opt);
    }

    count() {
        return this.ul.childElementCount;
    }
}

class PreferenceList {

    opts = {};
    el;
    ul;

    constructor(otherOptions, side) {

        this.ul = document.createElement("ul");
        this.el = this.ul;

        this.side = side;

        this.setupUl(this.ul, side);

        for (let [opt, v] of Object.entries(otherOptions)) {
            let [li, el] = this.addBottom(this.ul, this.side, opt);
            this.opts[opt] = {
                name: opt,
                li: li,
                el: el,
            }
        }
    }

    removeElement(ul, li, el) {
        li.content.removeChild(el);
        if (li.content.childElementCount == 0) {
            ul.removeChild(li);
            for (let i = 0; i < ul.children.length; i++) {
                if (ul.children[i].classList.contains("tmp")) continue;
                ul.children[i].posSpan.innerText = i+1;
            }
        }
    }
    
    addElement(li, side, name) {
        let el = li.content.appendChild(document.createElement("div"));
        let span = el.appendChild(document.createElement("span"));

        el.dataset.name = name;

        el.classList.add("element");
        span.innerText = name;
        span.classList.add("element-name");
        el.draggable = true;
        el.addEventListener("dragstart", (ev) => {
            ev.dataTransfer.setData("text/side", side);
            ev.dataTransfer.setData("text/name", name);
            ev.dataTransfer.effectAllowed = "move";
            el.classList.add("dragged");
        });
        el.ondragend = (ev) => {
            /*if (ev.dataTransfer.dropEffect == "move") {
                this.removeElement(ul, li, el);
            }*/
            el.classList.remove("dragged");
        }
        return el;
    }

    _getLiBefore(ul, insertY) {
        let beforeChild = null;
        for (let child of ul.children) {
            if (child.classList.contains("tmp")) continue;
            let y = child.getBoundingClientRect().top;
            beforeChild = child;
            if (insertY < y) break;
        }
        if (beforeChild && beforeChild.getBoundingClientRect().top + beforeChild.getBoundingClientRect().height <= insertY)
            beforeChild = null;
        return beforeChild;
    }
    
    insertLi(ul, side, insertY) {
        let li = ul.appendChild(document.createElement("li"));
        li.classList.add("li");
        li.posSpan = li.appendChild(document.createElement("span"));
        li.posSpan.classList.add("li-pos");
        li.content = li.appendChild(document.createElement("div"));
        li.content.classList.add("li-content");
        if (!insertY) ul.appendChild(li);
        else {
            let liBefore = this._getLiBefore(ul, insertY);
            ul.insertBefore(li, liBefore);
        }
    
        li.ondragover = (ev) => {
            if (ev.dataTransfer.getData("text/side") != side) return;
            if (!li.classList.contains("draggedover")) return;
    
            ev.preventDefault();
            ev.dataTransfer.dropEffect = "move";
        };
    
        li.ondrop = (ev) => {
            if (ev.dataTransfer.getData("text/side") != side) return;
            if (!li.classList.contains("draggedover")) return;
            
            ev.preventDefault();
            let dragged = document.getElementsByClassName("dragged")[0];
            let draggedLi = dragged.parentNode.parentNode;
            this.removeElement(ul, draggedLi, dragged);
            let el = this.addElement(li, side, ev.dataTransfer.getData("text/name"));
            li.classList.remove("draggedover");
            li.content.removeChild(li.getElementsByClassName("tmp")[0]);

            this.opts[ev.dataTransfer.getData("text/name")].li = li;
            this.opts[ev.dataTransfer.getData("text/name")].el = el;
        }
    
        li.ondragenter = (ev) => {
            if (ev.dataTransfer.getData("text/side") != side) return;
            if (li.classList.contains("draggedover")) return;
            let dragged = document.getElementsByClassName("dragged")[0];
            if (li.contains(dragged)) return; // already inside
    
            li.classList.add("draggedover");
    
            let tmpEl = li.content.appendChild(document.createElement("div"));
            tmpEl.classList.add("element");
            tmpEl.classList.add("tmp");
    
            tmpEl.style.width = dragged.getBoundingClientRect().width + "px";
            tmpEl.style.height = dragged.getBoundingClientRect().height + "px";
    
            ev.preventDefault();
        }
    
        li.ondragleave = (ev) => {
            if (ev.dataTransfer.getData("text/side") != side) return;
            if (!li.classList.contains("draggedover")) return;
            li.classList.remove("draggedover");
    
            li.content.removeChild(li.getElementsByClassName("tmp")[0]);
        }
    
        for (let i = 0; i < ul.children.length; i++) {
            ul.children[i].posSpan.innerText = i+1;
        }
    
        return li;
    }
    
    addBottom(ul, side, name) {
        let li = this.insertLi(ul, side, null);
        let el = this.addElement(li, side, name);
        return [li, el];
    }
    
    setupUl(ul, side) {
        ul.classList.add("preference-ul");
    
        ul.ondragenter = (ev) => {
            if (ev.target != ul) return;
            if (ev.dataTransfer.getData("text/side") != side) return;
            if (ul.classList.contains("draggedover")) return;
    
            let liBefore = this._getLiBefore(ul, ev.clientY);
            let dragged = document.getElementsByClassName("dragged")[0];
            let draggedLi = dragged.parentNode.parentNode;

            // if single element in li and wouldnt move it => ignore
            if (draggedLi.content.childElementCount == 1 && (liBefore == draggedLi || liBefore == draggedLi.nextSibling))
                return;

            ul.classList.add("draggedover");

            let tmpEl = document.createElement("div");
            tmpEl.classList.add("element");
            tmpEl.classList.add("tmp");

            
            tmpEl.style.width = dragged.getBoundingClientRect().width + "px";
            tmpEl.style.height = dragged.getBoundingClientRect().height + "px";

            ul.insertBefore(tmpEl, liBefore);
        }
    
        ul.ondragover = (ev) => {
            if (ev.target != ul) return;
            if (ev.dataTransfer.getData("text/side") != side) return;
            if (!ul.classList.contains("draggedover")) return;
    
            ev.preventDefault();
            ev.dataTransfer.dropEffect = "move";
        }
    
        ul.ondrop = (ev) => {
            if (ev.target != ul) return;
            if (ev.dataTransfer.getData("text/side") != side) return;
            if (!ul.classList.contains("draggedover")) return;

            ul.classList.remove("draggedover");
            ul.removeChild(ul.querySelectorAll(":scope > .tmp")[0]);

            let dragged = document.getElementsByClassName("dragged")[0];
            let draggedLi = dragged.parentNode.parentNode;
            this.removeElement(ul, draggedLi, dragged);
            let li = this.insertLi(ul, side, ev.clientY);
            let el = this.addElement(li, side, ev.dataTransfer.getData("text/name"));

            this.opts[ev.dataTransfer.getData("text/name")].li = li;
            this.opts[ev.dataTransfer.getData("text/name")].el = el;
        }
    
        ul.ondragleave = (ev) => {
            if (ev.target != ul) return;
            if (ev.dataTransfer.getData("text/side") != side) return;
            if (!ul.classList.contains("draggedover")) return;

            ul.classList.remove("draggedover");
            ul.removeChild(ul.querySelectorAll(":scope > .tmp")[0]); // only direct .tmp children
        }
    }

    addOpt(opt) {
        let [li, el] = this.addBottom(this.ul, this.side, opt);
        el.opt = opt;
        this.opts[opt] = {
            name: opt,
            li: li,
            el: el
        }
    }

    removeOpt(opt) {
        this.removeElement(this.ul, this.opts[opt].li, this.opts[opt].el);
        delete this.opts[opt];
    }

    getList() {
        let prios = {};
        for (let prio = 1; prio <= this.ul.children.length; prio++) {
            let li = this.ul.children[prio-1];
            for (let el of li.content.children) {
                prios[el.dataset.name] = prio;
            }
        }
        return prios;
    }
}

class PreferenceEditor {

    el;
    optsEl;
    options = {};
    otherOptions = {};

    constructor(side) {
        this.el = document.createElement("div");
        this.el.classList.add("preference-editor");
        this.optsEl = this.el.appendChild(document.createElement("ul"));
        this.optsEl.classList.add("pref-editor-options");

        this.side = side;

        this.prefWrapper = this.el.appendChild(document.createElement("div")); 
        this.prefWrapper.classList.add("pref-editor-wrapper");  
    }

    addOpt(opt) {
        let li = document.createElement("li");
        this.optsEl.appendChild(li);
        let prefsList = new PreferenceList(this.otherOptions, this.side);
        li.innerText = opt;
        this.options[opt] = {
            name: opt,
            el: li,
            prefsList: prefsList,
        };

        li.addEventListener("click", (ev) => {
            if (this.prefWrapper.children.length > 0)
                this.prefWrapper.removeChild(this.prefWrapper.children[0]);
            this.prefWrapper.appendChild(prefsList.el);
            for (let x of this.optsEl.getElementsByClassName("active"))
                x.classList.remove("active");
            li.classList.add("active");
        });
    }

    addOtherOpt(opt) {
        this.otherOptions[opt] = {};
        for (let thisOpt of Object.values(this.options)) {
            thisOpt.prefsList.addOpt(opt);
        }
    }

    removeOpt(opt) {
        this.optsEl.removeChild(this.options[opt].el);
        delete this.options[opt];
    }

    removeOtherOpt(opt) {
        delete this.otherOptions[opt];
        for (let thisOpt of Object.values(this.options)) {
            thisOpt.prefsList.removeOpt(opt);
        }
    }

    getPrefs() {
        let lists = {};
        for (let thisOpt of Object.values(this.options)) {
            lists[thisOpt.name] = thisOpt.prefsList.getList();
        }
        return lists;
    }
}

class Side {
    constructor(side) {
        let panesDiv = document.createElement("div");
        let sideDiv = document.getElementById(side);
        this.el = sideDiv;

        let wrapperDiv = sideDiv.appendChild(document.createElement("div"));

        wrapperDiv.appendChild(panesDiv);
        wrapperDiv.style.height = "100%";
        wrapperDiv.style.width = "100%";
        wrapperDiv.style.perspective = "1000px";

        panesDiv.classList.add("pane-container");

        let pane1 = panesDiv.appendChild(document.createElement("div"));
        pane1.classList.add("pane");
        pane1.classList.add("front");

        let swBtn = pane1.appendChild(document.createElement("button"));
        swBtn.classList.add("switch-btn");
        swBtn.innerText = "Preferences";
        swBtn.addEventListener("click", (ev) => {
            panesDiv.classList.toggle("flipped");
        });

        let paneHeader = pane1.appendChild(document.createElement("h1"));
        paneHeader.innerText = "Options";

        let optLeft = new OptionList();
        this.optList = optLeft;
        pane1.appendChild(optLeft.getEl());

        let prefEditor = new PreferenceEditor(side);
        this.prefEditor = prefEditor;

        let pane2 = document.createElement("div");
        pane2.classList.add("pane");
        pane2.classList.add("back");
        panesDiv.appendChild(pane2);
        pane2.appendChild(document.createElement("h1")).innerText = "Preferences";

        pane2.appendChild(prefEditor.el);

        swBtn = pane2.appendChild(document.createElement("button"));
        swBtn.classList.add("switch-btn");
        swBtn.innerText = "Options";
        swBtn.addEventListener("click", (ev) => {
            panesDiv.classList.toggle("flipped"); 
        });
    }
}

window.onload = () => {
    let sideLeft = new Side("left");
    let sideRight = new Side("right");

    function enableMatchBtnIfEqual() {
        let invalid = sideLeft.optList.count() != sideRight.optList.count();
        invalid ||= sideLeft.optList.count() == 0;
        document.getElementById("match-btn").disabled = invalid;
    }

    enableMatchBtnIfEqual();

    sideLeft.optList.onAdd = (opt) => {
        sideLeft.prefEditor.addOpt(opt);
        sideRight.prefEditor.addOtherOpt(opt);
        enableMatchBtnIfEqual();
    }
    sideLeft.optList.onRemove = (opt) => {
        sideLeft.prefEditor.removeOpt(opt);
        sideRight.prefEditor.removeOtherOpt(opt);
        enableMatchBtnIfEqual();
    }

    sideRight.optList.onAdd = (opt) => {
        sideRight.prefEditor.addOpt(opt);
        sideLeft.prefEditor.addOtherOpt(opt);
        enableMatchBtnIfEqual();
    }
    sideRight.optList.onRemove = (opt) => {
        sideRight.prefEditor.removeOpt(opt);
        sideLeft.prefEditor.removeOtherOpt(opt);
        enableMatchBtnIfEqual();
    }

    document.getElementById("match-btn").addEventListener("click", (ev) => {
        let prefsLeft = sideLeft.prefEditor.getPrefs();
        let prefsRight = sideRight.prefEditor.getPrefs();

        let keysLeft = Object.keys(prefsLeft);
        let keysRight = Object.keys(prefsRight);

        function convert(prefs, keysThis, keysOther) {
            let list = []; // list of list of (idx, pref)
            for (let key of keysThis) {
                let l = [];
                for (let keyOtherIdx = 0; keyOtherIdx < keysOther.length; keyOtherIdx++) {
                    let keyOther = keysOther[keyOtherIdx];
                    l.push([keyOtherIdx, prefs[key][keyOther]]);
                }
                list.push(l);
            }
            return list;
        }

        let listLeft = convert(prefsLeft, keysLeft, keysRight);
        let listRight = convert(prefsRight, keysRight, keysLeft);

        let matching = EGS(listLeft, listRight);

        let matchingNamed = {};
        for (let iLeft = 0; iLeft < listLeft.length; iLeft++) {
            matchingNamed[keysLeft[iLeft]] = keysRight[matching[iLeft]];
        };

        let modal = document.getElementById("modal");
        modal.classList.add("active");

        let resultsEl = document.getElementById("results-ul");
        resultsEl.innerHTML = "";

        for (let [left, right] of Object.entries(matchingNamed)) {
            let li = resultsEl.appendChild(document.createElement("li"));
            li.innerText = left + " - " + right;
        }

        document.getElementById("modal-close-btn").addEventListener("click", (ev) => modal.classList.remove("active"));
    });
}
