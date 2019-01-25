// Vuex data store
const store = new Vuex.Store({
	state: {
		tonic: 0, // C
		intervals: [1,0,1,0,1,1,0,1,0,1,0,1], // Major
	},
	mutations: {
		setTonic(state, idx) {
			idx = parseInt(idx);
			if(idx < 0) idx = 0;
			state.tonic = idx % state.intervals.length;
		},
		setIntervals(state, newIntervals) {
			for (var i = 0, len = state.intervals.length-newIntervals.length; i < len; i++) {
				newIntervals.push(0);
			}
			state.intervals = newIntervals;
		},
		toggleInterval(state, idx) {
			state.intervals.splice(idx, 1, (state.intervals[idx] ? 0 : 1));
		},
	},
});



Vue.component('fret', {
	props: ['x1', 'y1', 'x2', 'y2', 'num'], //.prob just need one x,y and one length var
	template: `<g class="fret">
		<line :x1="x1" :y1="y1" :x2="x2" :y2="y2"/>
		<text v-if="num !== undefined" :x="x1" :y="y1 - 15" style="pointer-events:none">
			{{ num }}
		</text>
	</g>`
});


Vue.component('string', {
	props: ['x1', 'y1', 'x2', 'y2', 'note'], //.prob just need one x,y and one length var
	template: `<g class="string">
		<line :x1="x1" :y1="y1" :x2="x2" :y2="y2"/>
		<text v-if="false && note !== undefined" :x="x1 - 15" :y="y1" style="pointer-events:none">
			{{ note.toUpperCase() }}
		</text>
	</g>`
});


Vue.component('note-dot', {
	props: {
		x: {type: Number, required: true},
		y: {type: Number, required: true},
		r: {type: Number, required: true},
		label: String,
		color: String,
		strokeWidth: {type: Number, default: 0},
	},
	computed: {
		fontSize: function() { return this.r * 1.1; },
	},
	template: `<g class="note-dot">
		<circle :cx="x" :cy="y" :r="r" :fill="color" stroke="black" :stroke-width="strokeWidth"/>
		<text :x="x" :y="y" :style="{'font-size':fontSize, 'font-weight':'bold', 'pointer-events':'none'}">
			{{ label }}
		</text>
	</g>`
});


Vue.component('guitar', {
	data: function() {
		return {
			x: 50,
			y: 25,
		};
	},

	props: {
		svgWidth: {type: Number, default: 1000},//.remove svg from name
		svgHeight: {type: Number, default: 200},//.remove svg from name
		frets: {
			type: Array,
			default: function() { return [0,22]; } // 0 to 22
		},
		tuning: {
			type: Array,
			default: function() { return [4,9,2,7,11,4]; } // Standard: EADGBE
		},
		labels: Array,
		colors: Array,
	},

	computed: {
		tonic: function() { return store.state.tonic; },
		intervals: function() { return store.state.intervals; },
		width: function() { return this.svgWidth - (this.x * 2); },
		height: function() { return this.svgHeight - (this.y * 2); },
		fretAry: function() {
			var ary = [];
			for (var fret = parseInt(this.frets[0]); fret <= parseInt(this.frets[1]); fret++) {
				ary.push(fret);
			}
			return ary;
		},
		fretDistance: function() { return this.width / this.fretAry.length; },
		stringDistance: function() { return this.height / (this.tuning.length - 1); },
		noteOffset: function() { return this.fretDistance / 4; },
		noteRadius: function() { return Math.min(this.fretDistance, this.stringDistance) / 3; },
		wrappedIntervals: function(){//.normalize this dup code
			var normal = [0,1,2,3,4,5,6,7,8,9,10,11];
			var wrapIdx = 12 - this.tonic;
			return normal.slice(wrapIdx).concat(normal.slice(0, wrapIdx));
		},
	},

	methods: {
		fretX(fret) { return this.x + fret * this.width / (this.fretAry.length - 1); },
		stringY(string) { return this.y + this.height - (string - 1) * this.height / (this.tuning.length - 1); },
		noteX(fret) { return this.fretX(fret) - this.noteOffset; },
		test() {
			for (var i = 0; i < this.tuning.length; i++) {
				for (var j = 0; j < this.fretAry.length; j++) {
					console.log('str'+i+',fret'+this.fretAry[j], this.tuning[i], this.intervals[this.wrappedIntervals[(this.tuning[i] + this.fretAry[j]) % 12]]);
				}
			}
		},
	},

	template: `<div>
		<svg :width="svgWidth" :height="svgHeight">
			<!-- Fret markers -->
			<rect
				v-for="(fret, i) in fretAry"
				v-if="i > 0 && [3,5,7,9,12,15,17,19,21,23,25,27].includes(fret)"
				:x="fretX(i) - 2*fretDistance/3"
				:y="stringY(tuning.length) + stringDistance/2"
				:width="fretDistance/3"
				:height="stringDistance * (tuning.length-2)"
				fill="#eee"
			/>

			<!-- Frets -->
			<fret v-for="(fret, i) in fretAry" :key="fret.id" :x1="fretX(i)" :y1="y" :x2="fretX(i)" :y2="y + height" :num="fret"/>

			<!-- Strings -->
			<string v-for="(intervalIdx, i) in tuning" :key="intervalIdx.id" :x1="x" :y1="stringY(i + 1)" :x2="x + width" :y2="stringY(i + 1)"/>

			<!-- Notes -->
			<g v-for="(intervalIdx, i) in tuning" :key="intervalIdx.id">
				<note-dot
					v-for="(fret, j) in fretAry"
					v-if="intervals[wrappedIntervals[(intervalIdx + fret) % 12]]"
					:key="fret.id"
					:x="noteX(j)"
					:y="stringY(i + 1)"
					:r="noteRadius"
					:label="labels[(intervalIdx + fret) % 12]"
					:color="colors[wrappedIntervals[(intervalIdx + fret) % 12]]"
				/>
			</g>

			<circle v-if="0" v-on:click="test()" cx="0" cy="0" r="20" fill="green" stroke="black" stroke-width="3"/>
		</svg>
	</div>`
});


Vue.component('white-key', {
	props: ['x', 'y', 'width', 'height', 'r', 'label', 'color'],
	template: `<g>
		<rect :x="x" :y="y" :width="width" :height="height" fill="white" stroke="black" stroke-width="2"/>
	</g>`
});
Vue.component('black-key', {
	props: ['x', 'y', 'width', 'height', 'label', 'color'],
	template: `<rect :x="x" :y="y" :width="width" :height="height" fill="#333" stroke="black" stroke-width="2"/>`
});

Vue.component('piano', {
	data: function() {
		return {
			strokeWidth: 2,
		};
	},

	props: {
		svgWidth: {type: Number, default: 8000},
		svgHeight: {type: Number, default: 200},
		octaves: {type: Number, default: 2},
		labels: Array,
		colors: Array,
	},

	computed: {
		tonic: function() { return store.state.tonic; },
		intervals: function() { return store.state.intervals; },
		width: function() { return this.svgWidth - this.strokeWidth * 2; },
		height: function() { return this.svgHeight - this.strokeWidth * 2; },
		whiteWidth: function() { return this.width / this.whiteKeys.length; },
		blackWidth: function() { return this.whiteWidth * 0.7; },
		blackHeight: function() { return this.height * 0.6; },
		whiteKeys: function() {
			var whites = [];
			for (var i = 0, len = this.octaves * 12 + 1; i < len; i++) {
				var interval = i % 12;
				if([0,2,4,5,7,9,11].includes(interval)) {
					whites.push(interval);
				}
			}
			return whites;
		},
		blackKeys: function() {
			var blacks = [];
			for (var i = 0, len = this.octaves * 12 + 1; i < len; i++) {
				var interval = i % 12;
				if([1,3,6,8,10].includes(interval)) {
					blacks.push(interval);
				}
			}
			return blacks;
		},
		keyIntervals: function() {
			var keys = [];
			for (var i = 0, len = this.octaves * 12 + 1; i < len; i++) {
				keys.push((i + this.tonic) % 12);
			}
			return keys;
		},
		wrappedIntervals: function(){//.normalize this dup code
			var normal = [0,1,2,3,4,5,6,7,8,9,10,11];
			var wrapIdx = 12 - this.tonic;
			return normal.slice(wrapIdx).concat(normal.slice(0, wrapIdx));
		},
	},

	methods: {
		whiteX(i) { return this.strokeWidth + i * this.width / this.whiteKeys.length; },
		blackX(i) {
			var octave = Math.floor(i / 5);
			var placeIn5 = i % 5;
			var x = octave * this.whiteWidth * 7 + this.strokeWidth;
			if(placeIn5 == 0) {
				x += this.whiteWidth * 1 - this.blackWidth / 2 - this.blackWidth * 0.2;
			} else if(placeIn5 == 1) {
				x += this.whiteWidth * 2 - this.blackWidth / 2 + this.blackWidth * 0.2;
			} else if(placeIn5 == 2) {
				x += this.whiteWidth * 4 - this.blackWidth / 2 - this.blackWidth * 0.3;
			} else if(placeIn5 == 3) {
				x += this.whiteWidth * 5 - this.blackWidth / 2;
			} else if(placeIn5 == 4) {
				x += this.whiteWidth * 6 - this.blackWidth / 2 + this.blackWidth * 0.3;
			}
			return x;
		},
		test() { console.log(this.tuning); },
	},

	template: `<svg :width="svgWidth" :height="svgHeight">
		<!-- White keys -->
		<g v-for="(interval, i) in whiteKeys" :key="interval.id">
			<white-key
				:x="whiteX(i)"
				:y="strokeWidth"
				:width="whiteWidth"
				:height="height"
			/>
			<note-dot
				v-if="intervals[wrappedIntervals[interval]]"
				:x="whiteX(i) + whiteWidth/2"
				:y="3 * height / 4"
				:r="whiteWidth * 0.3"
				:label="labels[wrappedIntervals[interval]]"
				:color="colors[wrappedIntervals[interval]]"
			/>
		</g>

		<!-- Black keys -->
		<g v-for="(interval, i) in blackKeys" :key="interval.id">
			<black-key
				:x="blackX(i)"
				:y="strokeWidth"
				:width="blackWidth"
				:height="blackHeight"
			/>
			<note-dot
				v-if="intervals[wrappedIntervals[interval]]"
				:x="blackX(i) + blackWidth/2"
				:y="blackHeight * 0.8"
				:r="blackWidth * 0.4"
				:label="labels[wrappedIntervals[interval]]"
				:color="colors[wrappedIntervals[interval]]"
			/>
		</g>
	</svg>`
});


Vue.component('scale-builder', {
	props: {
		width: {type: Number, required: true},
		colors: Array,
		labels: Array,
	},

	computed: {
		intervals: function() { return store.state.intervals; },
		buttonRadius: function(){ return this.width / 16; },
		height: function(){ return this.buttonRadius * 4; },
	},

	methods: {
		intervalX(i) {
			var padding = this.buttonRadius;
			var paddedWidth = this.width - 2 * padding;
			var relX = i<5 ? i : i+1;
			return padding + paddedWidth * relX / this.intervals.length;
		},
		intervalY(i) {
			if ([0,2,4,5,7,9,11].indexOf(i) !== -1) {
				return this.buttonRadius * 3;
			} else {
				return this.buttonRadius;
			}
		},

		fill(i) {
			if(this.colors && this.colors[i]) return this.colors[i];
			else return "#777";
		},

		toggleInterval(i) {
			store.commit('toggleInterval', i);
		},
	},

	template: `<svg :width="width" :height="height">
		<note-dot
			v-for="(label, i) in labels"
			@click.native="toggleInterval(i)"
			:key="label.id"
			:x="intervalX(i)"
			:y="intervalY(i)"
			:r="buttonRadius"
			:label="label"
			:color="fill(i)"
			:opacity="intervals[i] ? 1 : 0.25"
			style="cursor:pointer"
		/>
	</svg>`
});

Vue.component('note-wheel', {
	data: function() {
		return {
			strokeWidth: 4,
		};
	},

	props: {
		size: {type: Number, required: true},
		labels: {type: Array, required: true},
		colors: Array,
		circleOf: {
			validator: function(value) { return [2,4,5].indexOf(value) !== -1; },
			default: 2, // circle of 2nds (chromatic)
		},
	},

	computed: {
		tonic: function(){ return store.state.tonic; },
		intervals: function() { return store.state.intervals; },
		width: function(){ return this.size; },
		height: function(){ return this.size; },
		buttonRadius: function(){ return this.width * 0.08; },
		cx: function(){ return this.width / 2; },
		cy: function(){ return this.height / 2; },
		r: function(){ return Math.min(this.width, this.height) / 2 - this.buttonRadius - (this.strokeWidth/2); },
		wrappedIntervals: function(){//.normalize this dup code
			var normal = [0,1,2,3,4,5,6,7,8,9,10,11];
			var wrapIdx = 12 - this.tonic;
			return normal.slice(wrapIdx).concat(normal.slice(0, wrapIdx));
		},
	},

	methods: {
		dotX(i) { return this.r * Math.cos(this.theta(i)) + this.cx; },
		dotY(i) { return this.r * Math.sin(this.theta(i)) + this.cy; },
		theta(i) { return i * 2 * Math.PI / 12 - (Math.PI / 2); },

		fill(i) {
			if(this.colors && this.colors[i]) {
				return this.colors[i];
			} else {
				return "#777";
			}
		},

		setTonic(idx) {
			store.commit('setTonic', idx);
		},

		test() { console.log(this.wrappedIntervals); },
	},

	template: `<svg :width="width" :height="height">
		<circle v-if="0" v-on:click="test()" cx="0" cy="0" r="20" fill="green" stroke="black" stroke-width="3"/>

		<g v-for="(enabled, i) in intervals" :opacity="intervals[wrappedIntervals[i]] ? 1 : 0.25">
			<line v-if="intervals[wrappedIntervals[i]]" :x1="cx" :y1="cy" :x2="dotX(i)" :y2="dotY(i)" stroke="black" stroke-width="2"/>
			<note-dot
				@click.native="setTonic(i)"
				:x="dotX(i)"
				:y="dotY(i)"
				:r="buttonRadius"
				:label="labels[i]"
				:color="fill(wrappedIntervals[i])"
				:stroke-width="i==tonic ? strokeWidth : 0"
				style="cursor:pointer"
			/>
		</g>
	</svg>`
});


Vue.component('mode-switcher', {
	computed: {
		tonic: function(){ return store.state.tonic; },
		intervals: function() { return store.state.intervals; },

		modes: function() {
			var modes = [];
			for (var i = 0, len = this.intervals.length; i < len; i++) {
				if(this.intervals[i]) {
					var mode = this.intervals.slice(i).concat(this.intervals.slice(0, i))
					modes.push(mode);
				}
			}
			// Remove duplicates
			var set = new Set(modes.map(JSON.stringify));
			modes = Array.from(set).map(JSON.parse);
			return modes;
		},

		ianRings: function() {
			var numbers = [];
			for (var i = 0, len = this.modes.length; i < len; i++) {
				var binary = this.modes[i].slice().reverse().join('');
				numbers.push(parseInt(binary, 2));
			}
			return numbers;
		},

		modeNames: function() {
			var names = [];
			for (var i = 0, len = this.modes.length; i < len; i++) {
				var name = 'Scale #' + this.ianRings[i];
				var ary = scaleNames[this.ianRings[i]];
				if(ary != undefined) {
					name = ary[0];
				}
				names.push(name);
			}
			return names;
		},
	},

	methods: {
		goToParallel(idx) {
			store.commit('setIntervals', this.modes[idx]);
		},
		goToRelative(idx) {
			var n = 0;
			for (var i = 0, len = this.intervals.length; i < len; i++) {
				if(this.intervals[i]) {
					if(++n > idx) {
						store.commit('setTonic', this.tonic + i);
						break;
					}
				}
			}

			store.commit('setIntervals', this.modes[idx]);
		},
	},

	template: `<div>
		<table>
			<tr v-for="(mode, i) in modes" style="font-size:0.8em">
				<td>
					Go to
					<button v-on:click="goToParallel(i)" style="cursor:pointer">Parallel</button>
					<button v-on:click="goToRelative(i)" style="cursor:pointer">Relative</button>
				</td>
				<td>{{ modeNames[i] }}</td>
			</tr>
		</table>
	</div>`
});


Vue.component('chords', {
	props: {
		labels: Array,
	},

	computed: {
		tonic: function(){ return store.state.tonic; },
		intervals: function() { return store.state.intervals; },

		wrappedIntervals: function(){//.normalize this dup code (THIS ONE IS SLIGHTLY DIFFERENT FROM THE OTHERS)
			var normal = [0,1,2,3,4,5,6,7,8,9,10,11];
			var wrapIdx = this.tonic - 12;
			return normal.slice(wrapIdx).concat(normal.slice(0, wrapIdx));
		},

		chordGroups: function() {
			var grps = {"Triads":{}, "Sevenths":{}};

			// triads
			var combos = {
				"": [0,4,7],
				"m": [0,3,7],
				"+": [0,4,8],
				"º": [0,3,6],
				//"sus": [0,5,7],
				//"sus2": [0,2,7],
			};
			// loop through every note, starting with the tonic
			for (var i = this.tonic, len = this.tonic + this.intervals.length; i < len; i++) {
				var rootIdx = i % this.intervals.length;
				if(!this.intervals[rootIdx]) continue;
				// loop through each type of chord
				for (suffix in combos) {
					var isAvailable = true;
					// check for each sub-interval to be active
					for (j in combos[suffix]) {
						var intervalIdxToCheck = (combos[suffix][j] + rootIdx) % this.intervals.length;
						if(!this.intervals[intervalIdxToCheck]) {
							isAvailable = false;
							break;
						}
					}
					if(isAvailable) {
						if(grps["Triads"][rootIdx] == undefined) grps["Triads"][rootIdx] = [];
						grps["Triads"][rootIdx].push(this.labels[this.wrappedIntervals[rootIdx]] + suffix);
					}
				}
			}

			// sevenths
			var combos = {
				"7": [0,4,7,10],
				"M7": [0,4,7,11],
				"m7": [0,3,7,10],
				"mM7": [0,3,7,11],
				"ø7": [0,3,6,10],
				"º7": [0,3,6,9],
			};
			// loop through every note, starting with the tonic
			for (var i = this.tonic, len = this.tonic + this.intervals.length; i < len; i++) {
				var rootIdx = i % this.intervals.length;
				if(!this.intervals[rootIdx]) continue;
				// loop through each type of chord
				for (suffix in combos) {
					var isAvailable = true;
					// check for each sub-interval to be active
					for (j in combos[suffix]) {
						var intervalIdxToCheck = (combos[suffix][j] + rootIdx) % this.intervals.length;
						if(!this.intervals[intervalIdxToCheck]) {
							isAvailable = false;
							break;
						}
					}
					if(isAvailable) {
						if(grps["Sevenths"][rootIdx] == undefined) grps["Sevenths"][rootIdx] = [];
						grps["Sevenths"][rootIdx].push(this.labels[this.wrappedIntervals[rootIdx]] + suffix);
					}
				}
			}

			return grps;
		},
	},

	template: `<div>
		<div v-for="(sets, type) in chordGroups" style="display:inline-block; margin-left:1em; vertical-align:top;">
			<h4>{{ type }}</h4>
			<div v-for="(chords, rootIdx) in chordGroups[type]">
				<span v-for="chord in chords" style="margin-right:1.5em">{{ chord }}</span>
			</div>
		</div>
	</div>`
});


Vue.component('taylored-scale', {
	data: function() {
		var notationSystems = {};
		// letters: C Db D Eb E F F# G Ab A Bb B
		notationSystems.letters = [
			['C','B#','Dbb'], ['Db','Bx','C#'], ['D','Cx','Ebb'], ['Eb','D#','Fbb'], ['E','Dx','Fb'], ['F','E#','Gbb'],
			['F#','Ex','Gb'], ['G','Fx','Abb'], ['Ab','G#'], ['A','Gx','Bbb'], ['Bb','A#','Cbb'], ['B','Ax','Cb']
		];
		// degrees: 1 b2 2 b3 3 4 #4 5 b6 6 b7 7
		notationSystems.degrees = [
			['R','1'], ['b2','#1'], ['2'], ['b3','#2'], ['3'], ['4'],
			['T','#4','b5'], ['5'], ['b6','#5'], ['6'], ['b7','#6'], ['7']
		];
		// roman numerals: I bII II bIII III IV #IV V bVI VI bVII VII
		notationSystems.roman = [
			['I'], ['bII','#I'], ['II'], ['bIII','#II'], ['III'], ['IV'],
			['#IV','bV'], ['V'], ['bVI','#V'], ['VI'], ['bVII','#VI'], ['VII']
		];
		// intervals: P1 m2 M2 m3 M3 P4 TT P5 m6 M6 m7 M7
		notationSystems.intervals = [
			['P1','d2'], ['m2','A1'], ['M2','d3'], ['m3','A2'], ['M3','d4'], ['P4','A3'],
			['TT','A4','d5'], ['P5','d6'], ['m6','A5'], ['M6','d7'], ['m7','A6'], ['M7','d8']
		];
		// solfege: do di re ri mi fa fi so si la li ti
		notationSystems.solfege = [
			['do'], ['di','ra'], ['re'], ['ri','me'], ['mi'], ['fa'],
			['fi','se'], ['so','sol'], ['si','le'], ['la'], ['li','te'], ['ti']
		];
		// semitones: 0 1 2 3 4 5 6 7 8 9 10 11
		notationSystems.semitones = [
			['0'], ['1'], ['2'], ['3'], ['4'], ['5'],
			['6'], ['7'], ['8'], ['9'], ['10'], ['11']
		];
		// blank:
		notationSystems.blank = [
			[''], [''], [''], [''], [''], [''],
			[''], [''], [''], [''], [''], ['']
		];

		var frets = [0, Math.floor(window.innerWidth / 64)];

		return {
			notationSystems: notationSystems,
			scaleNames: scaleNames,//.hack (other file)
			labelType: 'degrees',
			colorschemes: {
				rainbow: ['#ff0000','#ff8000','#f8f800','#88ff00','#00f800','#00ffc0','#00f8f8','#0080ff','#0000ff','#8000ff','#ff00ff','#ff0080'],
				//loweredRaised //.3 diff colors: major, lowered, and raised notes (maybe one color for tonic too)
			},
			scaleSearch: null,
			frets: frets,
			guitarWidth: window.innerWidth,
			guitarHeight: Math.floor(window.innerWidth / 7),
			showGuitarCtrls: false,
		};
	},

	beforeMount: function() {
		// Set tonic
		var tonic = this.getParam('tonic');
		if(tonic) {
			store.commit('setTonic', tonic);
		}

		// Calculate intervals
		var intervals = this.getParam('intervals');
		if(intervals) {
			store.commit('setIntervals', intervals.split('').map(x => parseInt(x)));
		}
	},

	computed: {
		tonic: function(){ return store.state.tonic; },
		intervals: function() { return store.state.intervals; },
		width: function(){ return window.innerWidth; },
		height: function(){ return this.width / 7; },
		colors: function(){ return this.colorschemes.rainbow; },

		labels: function() {
			//.later: allow selection and save state of preferred enharmonics
			var labels = {};
			for (var system in this.notationSystems) {
				labels[system] = this.notationSystems[system].map(enharmonics => enharmonics[0]);
			}
			return labels;
		},

		permLink: function(){
			var base = window.location.href.split('?')[0];
			return base + '?tonic=' + this.tonic + '&intervals=' + this.intervals.join('');
		},

		ianRingNumber: function(){
			var binary = this.intervals.slice().reverse().join('');
			return parseInt(binary, 2);
		},

		allIanRingScales: function(){
			var all = [];
			for (num in this.scaleNames) {
				for (i in this.scaleNames[num]) {
					all.push({num: num, name: this.scaleNames[num][i]});
				}
			}
			all.sort(function(a,b){
				if(a.name < b.name) {
					return -1;
				} else {
					return parseInt(a.name > b.name);
				}
			});
			return all;
		},

		filteredIanRingScales: function(){
			var term = this.scaleSearch;
			if(!term) {
				return this.allIanRingScales;
			} else {
				return this.allIanRingScales.filter(function(scale) {
					var regex = new RegExp(".*" + term + ".*", "i");
					return regex.test(scale.name);
				});
			}
		},

		urlParams: function(){ return new URLSearchParams(window.location.search); },

		keyAndScale: function(){ return [this.tonic, this.intervals]; },
	},

	methods: {
		switchToIanRingScale(num) {
			num = parseInt(num);
			var intervals = num.toString(2).split('').reverse().map(n => parseInt(n));
			store.commit('setIntervals', intervals);
		},

		getParam(name) { return this.urlParams.get(name); },
		setParam(name, value) {
			var params = this.urlParams;
			params.set('tonic', value);
			window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
		},

		test() {
			console.log('hi');
		},
	},

	watch: {
		keyAndScale: function(newval, oldval) {
			// Update document title
			var title = 'Taylored Scale - ';
			title += this.labels.letters[this.tonic];
			var names = this.scaleNames[this.ianRingNumber];
			if(names) {
				var name = names[0];
				title += ' ' + this.scaleNames[this.ianRingNumber][0];
			}
			title += ' (' + this.ianRingNumber + ')';
			document.title = title;

			// Set cookie
			document.cookie = "tonic=" + this.tonic;
			document.cookie = "intervals=" + this.intervals.join('');
		},
	},

	template: `<div>
		<!-- Guitar -->
		<div>
			<!-- config -->
			<div style="border:1px solid #777; display:inline-block; padding:0.25em;">
				<button v-on:click="showGuitarCtrls = !showGuitarCtrls">Fretboard Options</button>
				<div v-show="showGuitarCtrls" style="padding:0.5em">
					Frets: <input type="number" v-model="frets[0]" style="width:5em"/> to <input type="number" v-model="frets[1]" style="width:4em"/>
					<br>
					Width: <button v-for="px in [-100,-50,-10,10,50,100]" v-on:click="guitarWidth += px">{{ (px>0 ? "+" : "") + px }}</button>
					<br>
					Height: <button v-for="px in [-50,-20,-5,5,20,50]" v-on:click="guitarHeight += px">{{ (px>0 ? "+" : "") + px }}</button>
				</div>
			</div>
			<guitar
				:svgWidth="guitarWidth"
				:svgHeight="guitarHeight"
				:frets="frets"
				:labels="labels.letters"
				:colors="colors"
			/>
		</div>

		<!-- Scale selection -->
		<div style="display:inline-block; margin:1em;">
			<scale-builder :width="height" :labels="labels.degrees" :colors="colors"/>
			<br><br>
			<note-wheel :size="height" :labels="labels.letters" :colors="colors"/>
		</div>

		<!-- Piano -->
		<div style="display:inline-block; margin:1em; vertical-align:top;">
			<piano
				:x="0"
				:y="0"
				:svgWidth="width * 0.5"
				:svgHeight="height"
				:labels="labels.degrees"
				:colors="colors"
			/>
		</div>

		<br>

		<div style="display:inline-block; margin:1em; vertical-align:top;">
			<h4>Mode Switcher</h4>
			<mode-switcher/>
		</div>

		<div style="display:inline-block; margin:1em; max-width:35em; text-align:center;">
			<h4>{{ labels.letters[tonic] + ' ' + scaleNames[ianRingNumber][0] }}</h4>
			<p style="font-size:0.8em">
				Permanent link to this scale:&nbsp;&nbsp;
				<a :href="permLink">{{ permLink }}</a>
			</p>
			<p style="font-size:0.8em">
				<i>Other names for this scale:</i>
				&nbsp;&nbsp;
				<span v-for="(name, i) in scaleNames[ianRingNumber]" style="white-space:nowrap">
					{{ name }}
					<span v-if="i != scaleNames[ianRingNumber].length - 1" style="white-space:normal">
						&nbsp;&mdash;&nbsp;
					</span>
				</span>
			</p>
			<p style="font-size:0.8em; font-style:italic;">
				Learn more about
				<a :href="'https://ianring.com/musictheory/scales/' + ianRingNumber" target="_blank">scale {{ ianRingNumber }}</a>
				at Ian Ring's website.
			</p>
		</div>

		<div style="display:inline-block; margin:1em; vertical-align:top;">
			<h4>Available Chords</h4>
			<chords :labels="labels.letters"/>
		</div>

		<div v-if="false" style="display:inline-block; margin:1em; vertical-align:top;">
			<label v-for="(labels, type) in notationSystems" style="margin-right:2em">
				<input type="radio" :value="type" v-model="labelType">
				{{ type }}
			</label>
		</div>

		<!-- Find a scale -->
		<div style="display:inline-block">
			<h4>Scale Finder</h4>
			<input type="search" v-model="scaleSearch" placeholder="Scale name"/>
			<div style="border:1px solid black; height:200px; width:500px; overflow-y:scroll; font-family:'Lucida Console', Monaco, monospace;">
				<div v-for="scale in filteredIanRingScales" v-on:click="switchToIanRingScale(scale.num)">
					{{ scale.name }}
				</div>
			</div>
		</div>

		<div style="display:none"><hr><button v-on:click="test">test</button></div>
	</div>`
});



// App controller
new Vue({
	el: '#app',
});
