	/**
	 * Mahjong gamr class
	 * @Author Cedric Martin - Nov 2013
	 * @Param b {object} UI board (jQuery)
	 * @Param t {object} UI top (jQuery)
	 * @Param r {object} UI right (jQuery)
	 */
	var mahjongGame = function (b, t, r) {
		// private vars
		var _initDone = false,
			_gameStarted = false,
			_deck = undefined,
			_board,
			_pot,
			_trash,
			$board = b,
			$pot = r,
			_checkPair,
			_tileClickCB,
			_tileFlipCB,
			_clickBoard,
			_checkInit,
			_selected = undefined,
			_selectedFrom = undefined,
			_nbCols = 18;

		// return true is combinaison works false otherwise
		_checkPair = function(tile1, tile2) {
			var t1,
				t2;

				t1 = tile1.getInfo();
				t2 = tile2.getInfo();

				// type of tile must match
				if (t1.type === t2.type) {

					// wheels, bamboos, numbers
					if (t1.type >= 1 && t1.type <= 3) {
						// sum must be equal to 10
						if (t1.value + t2.value === 10) {
							return true;
						}
					// winds
					} else if (t1.type === 4) {
						// pair of winds match
						if (t1.value === t2.value) {
							return true;
						}
					// any pair of flower match
					} else if (t1.type === 5) {
						return true;
					}
				}
				return false;
		}

		// Click event on the board itself
		_clickBoard = function (event, col) {
			var _offsetX,
				_colWidth,
				_clickedCol,
				_firstChild;

			console.log('_clickBoard');

			if (typeof _selected !== 'undefined' && _selectedFrom === _pot) {

				_colWidth = parseFloat($board.width()) / _nbCols;
				_clickedCol = parseInt(event.pageX / _colWidth);

				// if the board was clicked in the correct area IE in one of the columns
				if (_clickedCol >= 0 && _clickedCol < _nbCols) {

					// if the selected tiles and the highest tile in the col match then simulate the click
					if ( _board[_clickedCol].length > 0 && _checkPair(_selected, _board[_clickedCol][0])) {
						console.log('click first tile of column');
						_board[_clickedCol][0].getSprite().click();
					// else  move the tile from the pot at the highest position of the clicked column
					} else {
						
						// add the tile to the column
						_board[_clickedCol].splice(0, 0, _selected);

						// remove the tile from the pot
						_pot.pop();

						// detach the sprite from the pot UI
						_selected.getSprite().detach();

						// get the firstChild of the clicked column
						_firstChild = $('.col', $board).get(_clickedCol).firstChild;
	
						// insert the tile before the first one
						_selected.getSprite().before(_firstChild);

						// Reveal the last tile of the pot
						_pot[_pot.length - 1].flipTile(true);

						console.log(_pot[_pot.length - 1]);

						// unselect the selected tile
						_selected.unselect();

						// remove selection references
						_selected = undefined;
						_selectedFrom = undefined;
					}
				}
			}
		};

		// Click event on Tiles
		_tileClickCB = function(event, tile) {
			var match = false;

			// if the tile is visible check what to do
			if (tile.isVisible() === true) {

			//console.log(tile.getInfo());

				// user clicked on selected tile
				// cancel selection
				if (tile === _selected) {
					tile.unselect();
					_selected = undefined;
					_selectedFrom = undefined;
					return;
				}

				console.log('Tile is visible so can be clicked');

				// if it is the last tile of the pot (the one that should be visible)
				if (tile === _pot[_pot.length-1]) {

					// it is the first tile clicked so select it
					if (typeof _selected === 'undefined') {
						_selected = tile;
						tile.select();
						_selectedFrom = _pot;
					
					// otherwise check if the pair match
					} else {

						// does the pair match
						match = _checkPair(tile, _selected);

						// YES
						if (match === true) {

							tile.getSprite().fadeOut('fast');
							_selected.getSprite().fadeOut('fast');

							// add the tiles to the trash
							_trash.push(tile);
							_trash.push(_selected);

							// remove the tile from the board array
							_pot.splice(_pot.length-1, 1);

							// if selected tile come from the board
							// update the board array
							if (_selectedFrom === _board) {

								for (var j = 0; j < _nbCols; j++) {
									if (_selected === _board[j][0]) {
										_board[j].splice(0, 1);
										if (_board[j].length > 0) {
											_board[j][0].flipTile(true);
										}
									}
								}
							// otherwise update the pot array
							} else {
								console.log('error selected tile should come from the board')
							}

							if (_pot.length > 0) {
								_pot[_pot.length-1].flipTile(true);
							}

						// IF the tile does not match then add it to the top of the colunns
						}
						
						_selected.unselect();
						_selected = undefined;
						_selectedFrom = undefined;
					}
				
				// the clicked tile is not from the pot
				} else {
					console.log('there');
					for (var c = 0; c < _nbCols ; c++) {
						if (tile === _board[c][0]) {
							
							if (typeof _selected === 'undefined') {
								_selected = tile;
								tile.select();
								_selectedFrom = _board;

							} else if (tile !== _selected) {
								match = _checkPair(tile, _selected);

								if (match === true) {
									tile.getSprite().fadeOut('fast');
									_selected.getSprite().fadeOut('fast');

									// add the tiles to the trash
									_trash.push(tile);
									_trash.push(_selected);

									setTimeout(function (){
										tile.getSprite().detach();
										_selected.getSprite().detach();
									}, 500);

									// remove the tile from the board array
									_board[c].splice(0, 1);

									if (_board[c].length > 0) {
										_board[c][0].flipTile(true);
									}

									// if selected tile come from the board
									// update the board array
									if (_selectedFrom === _board) {

										for (var j = 0; j < _nbCols; j++) {
											if (_selected === _board[j][0]) {
												_board[j].splice(0, 1);
												if (_board[j].length > 0) {
													_board[j][0].flipTile(true);
												}
											}
										}
									// otherwise update the pot array
									} else if (_selectedFrom === _pot) {

										_pot.splice(_pot.length-1, 1);
										if (_pot.length > 0) {
											_pot[_pot.length-1].flipTile(true);
										}
									}

								_selected.unselect();
								_selected = undefined;
								_selectedFrom = undefined;

								} else {
									_clickBoard(event);
									//console.log(event);
								}
								
								/*_selected.unselect();
								_selected = undefined;
								_selectedFrom = undefined;*/

							}
						}
					}

				}
			}

			// prevent the event to go down to the board
			event.stopPropagation();
		};

		// tileFlip callback function to check if tile can be flipped
		_tileFlipCB = function (event) {
			return true;
		};

		// check if game is initialized
		_checkInit = function () {
			if (!_initDone) {
				alert('init should be called first');
			}
			return _initDone;
		};

		// public methods/vars
		return {

			init : function () {

				if (_initDone === true) {
					return;
				}

				if (typeof _deck !== 'undefined') {
					_deck.reset();
				}

				// create the mahjong deck
				_deck = mahjongDeck(_tileFlipCB, _tileClickCB);

				// shuffle the tiles 5 times
				_deck.shuffle(5);

				// initialize board with 18 columns
				_board = [];
				for (var i = 0 ; i < _nbCols; i++) {
					_board.push([]);
				};

				// initialize arrays
				_pot = [];
				_trash = [];

				// empty the board
				$board.html('');

				$board.on('click', _clickBoard);

				for (var i = 1 ; i <= _nbCols; i++) {
					var $col = $$('div');
					$col.addClass('col');

					//var $colInner = $$('div');
					//$colInner.addClass('inner');
					//$col.append($colInner);

					$board.append($col);
				}

				_initDone = true;
				_gameStarted = false;
			},
			getPot : function () {
				console.log('Pot Length = ' + _pot.length);
				for(var i = 0 ; i < _pot.length ; i++) {
					console.log(_pot[i].getInfo());
				}
			},
			getBoard : function (c,i) {
				console.log(_board[c][i].getInfo());
			},
			isStarted : function () {
				return _gameStarted;
			},
			reset : function () {
				$('.tile', $board).remove();

				// re-initialize values
				_pot = [];
				_trash = [];
				_deck.shuffle(5);
				_gameStarted = false;
			},
			start : function () {
				var _col,
					_tile,
					_sprite;

				if (!_initDone || _gameStarted) {
					alert('init should be called first')
					return;
				}

				if (_gameStarted === true) {
					alert('A game is already started! Please reset first');
					return;
				}

				/* Add 6x18 tiles to the board */
				_col = 0;
				for (var i = 0 ; i < 108 ; i++) {
					_tile = _deck.getTile(i);
					_sprite = _tile.getSprite(false);

					//console.log(_col);
					//console.log(_col + ' ' + $($('.col', $board)[_col]));

					// append Sprite to DOM
					$('.col', $board).get(_col).append(_sprite);

					// show the first tile of each column
					if (i < _nbCols) {
						_tile.flipTile(true);
					}

					// add tile to the board array
					_board[_col].push(_tile);

					_col++;
					
					if (_col > 17) {
						_col = 0;
					}
				}// for
				

				// add remaining tiles to the pot
				for (var i = 108; i < 144; i++) {
					_tile = _deck.getTile(i);
					_sprite = _tile.getSprite(false);

					// append the sprite to the ui
					$pot.append(_sprite);

					// add the tile to the pot
					_pot.push(_tile);
				}

				_tile.flipTile(true);

				/*setInterval(function () {
					$('#debug').html('');
					for(var i = _pot.length-1 ; i > 0 ; i--) {
						$('#debug').addDiv(JSON.stringify(_pot[i].getInfo()));
					}
				},500);*/

				_gameStarted = true;
			}// start
		}
	};
