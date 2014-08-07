// anonymous function
(function(){


	<!--REPLACE{"type": "inline", "file": "js/utils.js", "parse": false, "minify": false, "active": true}-->
	/* utils.js will be included here at build time */
	<!--/REPLACE-->

	<!--REPLACE{"type": "inline", "file": "js/mahjongTile.js", "parse": false, "minify": false, "active": true}-->
	/* mahjongTile.js will be included here at build time */
	<!--/REPLACE-->

	<!--REPLACE{"type": "inline", "file": "js/mahjongDeck.js", "parse": false, "minify": false, "active": true}-->
	/* mahjongDeck.js will be included here at build time */
	<!--/REPLACE-->

	<!--REPLACE{"type": "inline", "file": "js/mahjongGame.js", "parse": false, "minify": false, "active": true}-->
	/* mahjongGame.js will be included here at build time */
	<!--/REPLACE-->

document.addEventListener("DOMContentLoaded", function() {
	'use strict';

	var game = mahjongGame($("#ui-board"), $("#ui-top"), $("#ui-right")),
		startGame = function () {

		if (game.isStarted() === true) {
			game.reset();
		}

		$('#overlay').removeClass('animation-reverse');
		$('#overlay').removeClass('hidden');
		

		game.start();

		setTimeout(function () {
			$('#home').addClass('hidden');
			$('#game').removeClass('hidden');
			$('#overlay').addClass('animation-reverse');
			$('#overlay').addClass('hidden');
		},500);
	}


	$('#home .startButton').on('click', startGame);

	game.init();

	window.getPot = game.getPot;
	window.getBoard = game.getBoard;


}, false);

})();