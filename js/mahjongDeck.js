/**
 * Mahjong deck class
 * @Author Cedric Martin - Nov 2013
 */
var mahjongDeck = function (onflip, onclick) {
	'use strict';

	var _tiles = [],
		_canshuffle	= false,
		_onflip = onflip,
		_onclick = onclick,
		_emptytile,
		_shuffle,
		_tile;

	// create an empty tile that can be used by getTile or other function
	// this tile cannot be flipped and don't have any event
	_emptytile	= mahjongTile(0, 0, function (type, value) {return false}, function (event) {});

	_shuffle = function (arr) {
		for(var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
		return arr;
	};

	// there 4 tiles of each of this sets
	for (var n = 1 ; n <= 4 ; n++) {
		// create wheels, numbers and bamboos tiles
		for (var t = 1 ; t < 4 ; t++) {
			for (var v = 1 ; v <= 9 ; v++) {
				_tile = mahjongTile(t, v, _onflip, _onclick);
				_tiles.push(_tile);
			}
		}

		//create winds
		for (var v = 1 ; v <= 7 ; v++) {
			_tile = mahjongTile(4, v, _onflip, _onclick);
			_tiles.push(_tile);
		}
	}

	// create flowers (there only one flower of each value)
	for (var v = 1 ; v <= 8 ; v++) {
		_tile = mahjongTile(5, v, _onflip, _onclick);
		_tiles.push(_tile);
	}

	// our deck object that will be returned to caller
	return {
		// return the tile at index i
		getTile : function (i) {
			// if a tile out of index is requested return an empty tile
			if (i < 0 || i > _tiles.length -1) {
				return _emptytile;
			}
			return _tiles[i];
		},
		getLength : function () {
			return _tiles.length;
		},
		// shuffle the tile deck (can be done only once)
		// need to reset before shuffle again
		shuffle : function (n) {
			if (_canshuffle) {
				return false;
			}

			if (typeof n === 'undefined' || n <= 0) {
				var n = 1;
			}

			for (var i = 1 ; i <= n ; i++) {
			_tiles = _shuffle(_tiles);
			}

			_canshuffle = true;
			return true;
		},
		// reset all tiles to their hidden state and detach them from dom
		// TODO: real reset
		reset : function () {
			var _sprite,
				_parent;
				
			console.log('reset');
			// detach sprites from dom if attached
			for (var i = 0 ; i < _tiles.length ; i++) {
				_sprite = _tiles[i].getSprite(false);
				_parent = _sprite.parentNode;
				//console.log(typeof parent);
				if (_parent !== null) {
					_parent.removeChild(sprite);
				}
				_tiles[i].flipTile(false);
			}
			_canshuffle = true;
		}
	}
};