var jsHelper = {
	setNewPageUrl : function (url) {
		var loc = document.location.href;
		
		var strs = loc.split('/');
		strs[strs.length - 1] = url;
		
		var newLoc = strs.join('/');
		document.location.replace(newLoc);
	},
	
	parseGet : function() {
		var vars = {};
		var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
			vars[key] = value;
		});
		
    	return vars;
	},
    
    getDirection : function (keyCode) {
        switch(keyCode) {
            case 37: //left;
				return GameApi.MoveDirection.left;
            case 38: //up;
				return GameApi.MoveDirection.top;
            case 39: //right
				return GameApi.MoveDirection.right;
			case 40: //down
				return GameApi.MoveDirection.bottom;
			default:
				return -1;
        }
    },
	
	unpackMap: function (map) {
		var cellsCount = map.width * map.height;
		var unpacked = [];
		
		for (var i = 0; i < cellsCount; i++) {
			unpacked.push(0);
		}
		
		for (var i = 0; i < map.cells.length; i++) {
			var cell = map.cells[i];
			var cellNum = cell.location.x * map.height + cell.location.y;
			
			if (cell.type !== GameApi.MapCellType.policeRespawn &&
                cell.type !== GameApi.MapCellType.thiefRespawn) {
				
                    unpacked[cellNum] = cell.type;
			}
			
		}
		
		return { width: map.width, height: map.height, cells: unpacked };	
	}
}