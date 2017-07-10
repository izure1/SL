'use strict';

/*
 *  Scrolling Loader
 *  Sl.js v1.0.4
 *
 *  Copyright (C) izure.org 2017. All rights reserved.
 *  MIT LICENSE
 */

/**
 *
 * @param {String} tagname
 * @param {Object} option
 * @param {Function} callback
 */
var Sl = function (tagname, option) {
	if (this instanceof Sl === false) return new Sl(tagname, option);
	this.tagname = tagname;
	this.option = option;
	this.target = [];
	this.callback = [];
	return this;
};

Sl.prototype.observe = function (elemTar) {
	if (document.readyState === 'complete') this.__attach(elemTar);
	else Sl.root.queue.push({
		sl: this, target: elemTar
	});
	return this;
};

Sl.prototype.remove = function (elemTar) {
	var items = elemTar || this.target, self = this;
	for (var i = 0, len = this.target.length; i < len; i++) {
		var index = items.indexOf(this.target[i]), isExist = index !== -1;
		if (isExist) this.target.splice(i, 1);
	}
	if (this.target.length === 0) {
		Sl.root.list.splice(Sl.root.list.indexOf(this), 1);
	}
};

Sl.prototype.then = function (callback) {
	this.callback.push(callback);
	return this;
};

Sl.prototype.__attach = function (elemTar) {
	var items = Sl.root.fn.getNodeList(elemTar), self = this;
	items.forEach(function (item) {
		self.target.push({
			index: 0,
			element: item,
			active: true,
			value: undefined,
			throw: function (value) {
				this.index++;
				this.value = value;
				this.active = true;
				self.__append.call(self, this);
			}
		});
	});
	Sl.root.list.push(self);
};

Sl.prototype.__accept = function (parent) {
	parent.active = false;
	this.callback.forEach(function (fn) {
		fn.call(parent, parent.element, parent.index);
	});
};

Sl.prototype.__append = function (parent) {
	if (parent.active === false) return;
	//
	var element = document.createElement(this.tagname.toLowerCase());
	for (var i in this.option) {
		var res, opt = this.option[i];
		if (typeof opt === 'function') {
			res = opt.call(element, parent.value, parent.index);
		}
		else res = opt;
		//
		if (i === 'text') element.textContent = res;
		else if (i === 'html') {
			if (res instanceof HTMLElement) element.appendChild(res);
			else element.innerHTML = res;
		}
		else {
			element.setAttribute(i, res);
		}
	}
	parent.element.parentNode.insertBefore(element, parent.element);
	setTimeout(Sl.check, 1);
};

Sl.root = {};
Sl.root.fn = {};
Sl.root.list = [];
Sl.root.queue = [];

Sl.check = function () {
	if (document.readyState !== 'complete') return;
	// timer delay for performance
	if (Sl.root.timer) {
		clearTimeout(Sl.root.timer);
	}
	Sl.root.timer = setTimeout(Sl.__fire, 100);
};

Sl.__fire = function () {
	var list = Sl.root.list;
	var scrollY = window.scrollY + document.documentElement.clientHeight;
	for (var i = 0, len = list.length; i < len; i++) {
		var sl = list[i];
		var j = sl.target.length;
		while (j--) {
			var parent = sl.target[j];
			if (parent.element.offsetTop > scrollY) continue;
			else sl.__accept(parent);
		}
	}
};

Sl.root.fn.getNodeList = function (elemTar) {
	var items;
	if (elemTar instanceof Array) items = elemTar;
	else if (elemTar instanceof NodeList) items = Array.from(elemTar);
	else if (elemTar instanceof HTMLElement) items = [elemTar];
	else items = Array.from(document.querySelectorAll(elemTar));
	return items;
};

window.addEventListener('scroll', Sl.check);
window.addEventListener('load', function () {
	Sl.root.queue.forEach(function (item) {
		item.sl.__attach(item.target);
	});
	delete Sl.root.queue;
	Sl.check();
});