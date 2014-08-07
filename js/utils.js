	
	// return true if needle is found in haystack
	var inArray = function(needle, haystack, argStrict) {
		var key = '', strict = !!argStrict;
		if (strict) {
			for (key in haystack) {
				if (haystack[key] === needle) {
					return true;
				};
			};
		} else {
			for (key in haystack) {
				if (haystack[key] === needle) {
					return true;
				};
			};
		};
		return false;
	},

	getStyle = function(el, prop) {
		if (document.defaultView && document.defaultView.getComputedStyle) {
			return document.defaultView.getComputedStyle(el, null)[prop];
		} else if (el.currentStyle) {
			return el.currentStyle[prop];
		} else {
			return el.style[prop];
		}
	},

	// Alias to createElement
	$$ = function (e) {
		return	$(document.createElement(e));
	},

	$C = function (e) {
		return	document.createElement(e);
	},

	$ = function () {
		var a = [],
			o,
			r,
			l;

			if (typeof arguments[1] !== 'undefined') {
				r = arguments[1].querySelectorAll(arguments[0]);
			} else if (typeof arguments[0] !== 'string') {
				r = [arguments[0]];
			} else {
				r = document.querySelectorAll(arguments[0]);
			}

			l = r.length;

			//console.log(arguments);
		//console.trace();

		function each(callback) {
			for (var j = 0 ; j < l ; j++) {
				callback.apply(a[j]);
			}
		};
		
		function on(evtname, callback) {

			var _cb = function() {
				callback.call(this);
			};

			if (this.addEventListener ) {
				this.addEventListener(evtname, callback, false);
			} else if ( this.attachEvent ) {
				this.attachEvent( "on" + evtname, callback);
			}
		};

		function off(evtname) {
			this.removeEventListener(evtname);
		};

		
		function addClass(cls) {
			var classes,
				l;

			if (typeof cls === 'undefined' || cls === '') {
				return false;
			}
			
			classes = cls.split(' ');
			l = classes.length;

			if ('classList' in document.documentElement) {
				for(var i = 0 ; i < l ; i++) {
					this.classList.add(classes[i]);
				}
			} else {
				this.className += ' ' + cls;
			}

			return true;
		};

		function hasClass(cls) {
			if ('classList' in document.documentElement) {
				return this.classList.contains(cls);
			} else {
				return this.className && new RegExp('(\\s|^)' + cls + '(\\s|$)').test(this.className);
			}
		};
		
		function removeClass(cls) {
			if ('classList' in document.documentElement) {
				this.classList.remove(cls);
			} else {
				var reg = new RegExp("(\\s|^)" + cls + "(\\s|$)");
				this.className = this.className.replace(reg, ' ').replace(/(^\s*)|(\s*$)/g,'');
			}
		};
		
		function append() {
			if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
				if (typeof arguments[0] === 'object') {
					this.appendChild(arguments[0]);
				}
			}
		};
		
		function addDiv(s) {
			var d = $$('div');
			$(d).html(s);
			this.append(d);
		};

		function attr(attrName, value) {
			if (typeof value === 'undefined') {
				return this.getAttribute(attrName);
			} else {
				this.setAttribute(attrName, value);
			}
		};

		function prop(propName, value) {
			if (typeof value === 'undefined') {
				return this[propName];
			} else {
				if (typeof this[propName] !== 'undefined') {
					this[propName] = value;
				} else {
					this.setAttribute(propName, value);
				}
			}
		};
		
		function width(w) {
			if (typeof w === 'undefined') {
				return parseFloat(getStyle(this, 'width'));
			} else {
				this.style.width = w + 'px';
			}
		};
		
		function click() {
		
		};
		
		function get(index) {
			return r[index];
		};

		function length() {
			return r.length;
		};

		function detach(){
			console.log('Detach');
			var parent = this.parentNode;
			parent.removeChild(this);
		};

		function before(e) {
			var parent = e.parentNode;
			parent.insertBefore(this, e);
		};

		/*function remove() {
			var parent = this.parentNode;
			parent.removeChild(this);
			return parent;
		};*/
		
		function html(str) {
			if (typeof str === 'undefined') {
				return this.innerHTML;
			} else {
				this.innerHTML = str;
				return this;
			}
		};
	
		function fadeOut(speed, callback) {
			this.addClass('fadedOut-' + speed);
		};

		function fadeIn(speed, callback) {
			this.addClass('fadedIn-' + speed);
		};

	
		for (var i = 0 ; i < l ; i++) {

			r[i].each = each;
			r[i].on = on;
			r[i].addClass = addClass;
			r[i].removeClass = removeClass;
			r[i].append = append;
			r[i].addDiv = addDiv;
			r[i].attr = attr;
			r[i].prop = prop;
			r[i].width = width;
			r[i].click = click;
			r[i].get = get;
			r[i].fadeOut = fadeOut;
			r[i].length = length;
			//r[i].remove = remove;
			r[i].detach = detach;
			r[i].before = before;
			r[i].html = html;
			
			a.push(r[i]);
		}

		return r[0];
	};
