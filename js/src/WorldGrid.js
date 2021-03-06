class WorldGrid {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.blockType = Object.freeze({
            FLAT: 0, // 4 neighbors
            FLATF: 1,
            CORNER: 2, // 2 neighbors, corner
            CORNERF: 3,
            LINE: 4, // 2 neighbors, line
            LINEF: 5,
            ONE: 6, // 1 neighbor
            ONEF: 7,
            SOLO: 8, // 0 neighbors
            SOLOF: 9,
            EMPTY: -1
        });

        this.grid = new Array();
        this.types = new Array();
        this.initGrid();
    }

    initGrid() {
        var cliffs = this.generateCliffs();
        for(var x = 0; x < this.x; ++x) {
            this.grid[x] = new Array();
            this.types[x] = new Array();
            for(var y = 0; y < this.y; ++y) {
                this.grid[x][y] = new Array();
                this.types[x][y] = new Array();
                for(var z = 0; z < this.z; ++z) {
                    this.types[x][y][z] = this.blockType.EMPTY;
                    this.grid[x][y][z] = cliffs[y][x][z];
                }
            }
        }
        for(var x = 0; x < this.x; ++x) {
            for(var y = 0; y < this.y; ++y) {
                for(var z = 0; z < this.z; ++z) {
                    this.types[x][y][z] = this.getBlockType(x, y, z).type;
                }
            }
        }
    }

    getBlockType(x, y, z) {
        var type = this.blockType.EMPTY;
        var neighbors = 0; // The number of adjacent neighbors
        var rotation = 0;
        var n = false, s = false, e = false, w = false; // Used to calculate orientation
        // Calculate the value of n
        if(x+1 < this.x) { // +x neighbors
            if(this.grid[x+1][y][z] == 1) {
                neighbors++;
                e = true;
            }
        }
        if(x-1 >= 0) {
            if(this.grid[x-1][y][z] == 1) {
                neighbors++;
                w = true;
            }
        }
        if(z+1 < this.z) { // +x neighbors
            if(this.grid[x][y][z+1] == 1) {
                neighbors++;
                n = true;
            }
        }
        if(z-1 >= 0) {
            if(this.grid[x][y][z-1] == 1) {
                neighbors++;
                s = true;
            }
        }
        // Determine what type of block this is
        if(neighbors == 0) {
            type = this.blockType.SOLO;
        }
        else if(neighbors == 1) {
            type = this.blockType.ONE;
            if(n) {
                rotation = 0;
            }
            else if(e) {
                rotation = Math.PI/2;
            }
            else if(s) {
                rotation = Math.PI;
            }
            else {
                rotation = 3*Math.PI/2;
            }
        }
        else if(neighbors == 2) {
            type = this.blockType.CORNER;
            if(n && e) {
                rotation = Math.PI/2;
            }
            else if(s && e) {
                rotation = Math.PI;
            }
            else if(s && w) {
                rotation = 3*Math.PI/2;
            }
            else if(n && w) {
                rotation = 0;
            }
            else {
                type = this.blockType.FLAT;
            }
        }
        else {
            type = this.blockType.FLAT;
            var angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2]
            rotation = angles[Math.round(Math.random() * 3)];
        }

        // Determine what style of block this is
        if(y < this.y - 1) {
            if(this.grid[x][y+1][z] == 1) {
                if(!(type == this.blockType.FLAT && this.types[x][y+1][z] == this.blockType.SOLO)) {
                    type += 1;
                }
            }
        }

        var tile = {
            'type': type,
            'rot': rotation

        };

        return tile;
    }

    // Returns an array of 2D arrays, each representing a layer of tiles
    generateCliffs() {
        var rand = Math.random(); // Random [0,1]
        // Set # layers
        var iter = this.y - Math.round(rand * rand * this.y); // Weighted towards max
        var cliffs = new Array();
        var dummy = new Array(); // Used for first iteration
        // Initialize arrays
        for(var x = 0; x < this.x; x++) {
            cliffs[x] = new Array();
            dummy[x] = new Array();
            for(var y = 0; y < this.y; y++) {
                cliffs[x][y] = new Array();
                dummy[x][y] = 1;
                for(var z = 0; z < this.z; z++) {
                    cliffs[x][y][z] = 0;
                }
            }
        }
        for(var i = 0; i < iter; i++) {
            if(i == 0) {
                cliffs[i] = this.generateLayer(dummy);
            }
            else {
                cliffs[i] = this.generateLayer(cliffs[i-1]);
            }
        }
        return cliffs;
    }

    generateLayer(prevLayer) {
        var n = 3; // Number of times to place a random-sized cluster
        var prevArea = 0; // Total number of blocks in previous layer
        var xmax = 0, xmin = this.x - 1, zmax = 0, zmin = this.z - 1;
        var maxArea = this.x * this.z;
        var layer = new Array();
        // Initialize layer
        for(var x = 0; x < this.x; x++) {
            layer[x] = new Array();
            for(var z = 0; z < this.z; z++) {
                layer[x][z] = 0;
                if(prevLayer[x][z] == 1) {
                    prevArea++;
                    xmin = Math.min(x, xmin);
                    xmax = Math.max(x, xmax);
                    zmin = Math.min(z, zmin);
                    zmax = Math.max(z, zmax);
                }
            }
        }
        var xAvg = Math.ceil(0.5 * (xmin + xmax));
        var zAvg = Math.ceil(0.5 * (zmin + zmax));
        // Place a random-sized cluster on this layer n times
        for(var i = 0; i < n; i++) {
            // Pick cluster size
            var sizeWeight = Math.min(prevArea / maxArea + 0.4, 1);
            var rand = Math.min(Math.random() / sizeWeight, 1);
            var size = Math.round(rand * 2) + 2; // Pick from [2,5]
            // Pick cluster center (xc, zc)
            var xc = Math.round(Math.random() * this.x);
            var zc = Math.round(Math.random() * this.z);
            if(prevLayer[Math.max(xAvg - Math.round(size/2), 0)][zAvg] != 1) { xc++; }
            if(prevLayer[xAvg][Math.max(zAvg - Math.round(size/2), 0)] != 1) { zc++; }
            if(prevLayer[Math.min(xAvg + Math.round(size/2), this.x - 1)][zAvg] != 1) { xc--; }
            if(prevLayer[xAvg][Math.min(zAvg + Math.round(size/2), this.z - 1)] != 1) { zc--; }
            // Add blocks around xstart and zstart
            for(var x = xc - Math.floor(size/2); x < xc + Math.round(size/2); x++) {
                for(var z = zc - Math.floor(size/2); z < zc + Math.round(size/2); z++) {
                    // Clip the cluster to the world size...
                    var boundsX = Math.max(Math.min(x, this.x - 1), 0);
                    var boundsZ = Math.max(Math.min(z, this.z - 1), 0);
                    // ...and then to previous later
                    if(prevLayer[boundsX][boundsZ] == 1) {
                        layer[boundsX][boundsZ] = 1;
                    }
                }
            }
        }
        return layer;
    }
}
