/**
 * Mahjong tile class
 * @Author Cedric Martin - Nov 2013
 */
var mahjongTile = function (type, value, onflip, onclick) {
	'use strict';

	var _type = parseInt(type),
		_value = parseInt(value),
		_visible = false,
		_onflip,
		_onclick,
		$content,
		$inner,
		$sprite,
		_sprite,
		_tile;

	// this is a callback that will be called before flipping the tile to check if this tile is allowed to be flipped
	// callback should return a boolean
	_onflip = (typeof onflip !== 'function') ? function (type, value) {return false} : onflip;

	// this is a callback that will be called when a tile will be clicked
	_onclick = (typeof onclick !== 'function') ? function (type, value) {} : onclick;

	// if type of tile is not in supported range
	// don't create the tile
	if (_type < 0 || _type > 5) {
		return null;
	}

	// check if _value is in correct range for this _type of tile
	switch (_type) {
		case 0:
			_value = 0;
			break;
		case 1:
		case 2:
		case 3:
			if (_value < 1 || _value > 9) {
				return null;
			}	
			break;
		case 4:
			if (_value < 1 || _value > 7) {
				return null;
			}	
			break;
		case 5:
			if (_value < 1 || _value > 8) {
				return null;
			}	
			break;
		default:
			return null;
			break;
	}

	// create the tile sprite (basically a div with classes )
	$content = $$('div');
	//$content.addClass('t-1-1');
	
	$inner = $$('div');
	$inner.addClass('inner back');

	$inner.append($content);

	_sprite = $C('div');
	$sprite = $(_sprite);

	$sprite.append($inner);
	$sprite.addClass('tile');

	// Public method of our object that will be returned to caller
	_tile = {
		getSprite : function (jq) {
			if (typeof jq === 'undefined' || jq === true) {
				return $sprite;
			} else {
				return _sprite;
			}
		},
		getInfo : function () {
			return {'type':_type, 'value': _value};
		},
		flipTile : function (visible) {
			if (visible && _onflip(_type, _value)) {
				$inner.removeClass('back');
				$inner.addClass('front');
				$content.addClass('t-' + _type + '-' + _value);
				_visible = true;
			} else if (!visible) {
				$content.attr('class','');
				$inner.addClass('back');
				$inner.removeClass('front');
				_visible = false;
			} else {
				console.log('You are not allowed to flip see tile');
			}
		},
		select : function () {
			$inner.addClass('selected');
		},
		unselect : function () {
			$inner.removeClass('selected');
		},
		isVisible : function () {
			return _visible;
		}
	}

	// bind click event to sprite
	$sprite.on('click', function (event) {
		_onclick(event, _tile);
	});

	return _tile;
};
