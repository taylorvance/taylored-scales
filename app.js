// Vuex data store
const store = new Vuex.Store({
	state: {
		tonicIdx: 0, // C
		tonicOptions: [
			['C'], ['C#','Db'], ['D'], ['D#','Eb'], ['E'], ['F'],
			['F#','Gb'], ['G'], ['G#','Ab'], ['A'], ['A#','Bb'], ['B']
		],
		intervalSet: [
			{enharmonics: ['P1'], on: true}, // removed d2 to make the note name algorithm easier
			{enharmonics: ['m2','A1'], on: false},
			{enharmonics: ['M2','d3'], on: true},
			{enharmonics: ['m3','A2'], on: false},
			{enharmonics: ['M3','d4'], on: true},
			{enharmonics: ['P4','A3'], on: true},
			{enharmonics: ['A4','d5'], on: false},
			{enharmonics: ['P5','d6'], on: true},
			{enharmonics: ['m6','A5'], on: false},
			{enharmonics: ['M6','d7'], on: true},
			{enharmonics: ['m7','A6'], on: false},
			{enharmonics: ['M7','d8'], on: true},
		],
		pitchClasses: [
			['B#','C','Dbb'], ['Bx','C#','Db'], ['Cx','D','Ebb'], ['D#','Eb','Fbb'], ['Dx','E','Fb'], ['E#','F','Gbb'],
			['Ex','F#','Gb'], ['Fx','G','Abb'], ['G#','Ab'], ['Gx','A','Bbb'], ['A#','Bb','Cbb'], ['Ax','B','Cb']
		],
	},

	mutations: {
		setTonic(state, idx) {
			idx = parseInt(idx);
			if(idx < 0) idx = 0;
			state.tonicIdx = idx % state.intervalSet.length;
		},
		setIntervals(state, newIntervals) {
			// Fill any missing intervals with 0
			for (var i = 0, len = state.intervalSet.length - newIntervals.length; i < len; i++) {
				newIntervals.push(0);
			}
			// Set the "on" value
			for (var i = 0, len = newIntervals.length; i < len; i++) {
				state.intervalSet[i].on = Boolean(newIntervals[i]);
			}
		},
		toggleInterval(state, idx) {
			state.intervalSet[idx].on = !state.intervalSet[idx].on;
		},
		enharmonicizeInterval(state, idx) {
			state.intervalSet[idx].enharmonics.push(state.intervalSet[idx].enharmonics.shift());
		},
		enharmonicizeTonic(state, idx) {
			state.tonicOptions[idx].push(state.tonicOptions[idx].shift());
		},
	},

	getters: {
		tonic: function(state) { return state.tonicOptions[state.tonicIdx][0]; },

		booleanIntervals: function(state) {
			return state.intervalSet.map(function(interval){ return interval.on ? 1 : 0; });
		},

		noteNames: function(state, getters) {
			var names = [];

			var tonicLetter = getters.tonic[0];
			var allLetters = 'CDEFGABCDEFGABC';
			var tonicLetterIdx = allLetters.indexOf(tonicLetter);

			state.intervalSet.forEach(function(interval, i) {
				var intervalName = interval.enharmonics[0];
				var quality = intervalName[0];
				var number = parseInt(intervalName[1]);
				var semitones = i;

				var targetLetter = allLetters[tonicLetterIdx + number - 1];
				var pitchClass = state.pitchClasses[(state.tonicIdx + semitones) % state.pitchClasses.length];
				pitchClass.forEach(function(note){
					if(note[0] == targetLetter) {
						names.push(note);
					}
				});
			});

			var wrapIdx = state.pitchClasses.length - state.tonicIdx;
			return names.slice(wrapIdx).concat(names.slice(0, wrapIdx));

			return names;
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
		tonic: {type:Number, default:0},
		intervals: Array,
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
		wrappedIdxs: function(){//.normalize this dup code
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
					console.log('str'+i+',fret'+this.fretAry[j], this.tuning[i], this.intervals[this.wrappedIdxs[(this.tuning[i] + this.fretAry[j]) % 12]]);
				}
			}
		},
	},

	template: `<svg :width="svgWidth" :height="svgHeight">
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
		<g v-for="(tuningIdx, i) in tuning" :key="tuningIdx.id">
			<note-dot
				v-for="(fret, j) in fretAry"
				v-if="intervals[wrappedIdxs[(tuningIdx + fret) % 12]]"
				:key="fret.id"
				:x="noteX(j)"
				:y="stringY(i + 1)"
				:r="noteRadius"
				:label="labels[(tuningIdx + fret) % 12]"
				:color="colors[wrappedIdxs[(tuningIdx + fret) % 12]]"
			/>
		</g>

		<circle v-if="0" v-on:click="test()" cx="0" cy="0" r="20" fill="green" stroke="black" stroke-width="3"/>
	</svg>`
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
		tonic: function() { return store.state.tonicIdx; },
		intervals: function() { return store.getters.booleanIntervals; },
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
			<rect :x="whiteX(i)" :y="strokeWidth" :width="whiteWidth" :height="height" fill="white" stroke="black" :stroke-width="strokeWidth"/>
			<note-dot
				v-if="intervals[wrappedIntervals[interval]]"
				:x="whiteX(i) + whiteWidth/2"
				:y="3 * height / 4"
				:r="whiteWidth * 0.3"
				:label="labels[interval]"
				:color="colors[wrappedIntervals[interval]]"
			/>
		</g>

		<!-- Black keys -->
		<g v-for="(interval, i) in blackKeys" :key="interval.id">
			<rect :x="blackX(i)" :y="strokeWidth" :width="blackWidth" :height="blackHeight" fill="#333" stroke="black" :stroke-width="strokeWidth"/>
			<note-dot
				v-if="intervals[wrappedIntervals[interval]]"
				:x="blackX(i) + blackWidth/2"
				:y="blackHeight * 0.8"
				:r="blackWidth * 0.4"
				:label="labels[interval]"
				:color="colors[wrappedIntervals[interval]]"
			/>
		</g>
	</svg>`
});


Vue.component('scale-builder', {
	props: {
		width: {type: Number, required: true},
		colors: Array,
	},

	computed: {
		labels: function() { return store.state.intervalSet; },
		buttonRadius: function(){ return this.width / 16; },
		height: function(){ return this.buttonRadius * 7.5; },
	},

	methods: {
		intervalX(i) {
			var padding = this.buttonRadius;
			var paddedWidth = this.width - 2 * padding;
			var relX = i<5 ? i : i+1;
			return padding + paddedWidth * relX / this.labels.length;
		},
		intervalYoffset(i) {
			if ([0,2,4,5,7,9,11].indexOf(i) !== -1) {
				return this.buttonRadius;
			} else {
				return -this.buttonRadius;
			}
		},

		fill(i) {
			if(this.colors && this.colors[i]) return this.colors[i];
			else return "#777";
		},

		toggleInterval(i) { store.commit('toggleInterval', i); },
		enharmonicizeInterval(i) { store.commit('enharmonicizeInterval', i); },
	},

	template: `<svg :width="width" :height="height">
		<g v-for="(row, i) in labels" :key="row.id">
			<note-dot
				@click.native="toggleInterval(i)"
				:x="intervalX(i)"
				:y="height/2 + intervalYoffset(i)"
				:r="buttonRadius"
				:label="row.enharmonics[0]"
				:color="fill(i)"
				:opacity="row.on ? 1 : 0.25"
				style="cursor:pointer"
			/>
			<text
				v-show="row.enharmonics.length > 1"
				v-on:click="enharmonicizeInterval(i)"
				:x="intervalX(i)"
				:y="height/2 + intervalYoffset(i) * 3"
				:fill="fill(i)"
				:opacity="row.on ? 1 : 0.25"
				style="dominant-baseline:middle; font-weight:bold; cursor:pointer;"
			>↻</text>
		</g>
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
		colors: Array,
		circleOf: {
			validator: function(value) { return [2,4,5].indexOf(value) !== -1; },
			default: 2, // circle of 2nds (chromatic)
		},
	},

	computed: {
		labels: function(){ return store.state.tonicOptions.map(function(row){ return row[0]; }); },
		tonic: function(){ return store.state.tonicIdx; },
		intervals: function() { return store.getters.booleanIntervals; },
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

		clickTonic(idx) {
			if(this.tonic == idx) {
				store.commit('enharmonicizeTonic', idx);
			} else {
				store.commit('setTonic', idx);
			}
		},

		test() { console.log(this.wrappedIntervals); },
	},

	template: `<svg :width="width" :height="height">
		<circle v-if="0" v-on:click="test()" cx="0" cy="0" r="20" fill="green" stroke="black" stroke-width="3"/>

		<g v-for="(enabled, i) in intervals" :opacity="intervals[wrappedIntervals[i]] ? 1 : 0.25">
			<line v-if="intervals[wrappedIntervals[i]]" :x1="cx" :y1="cy" :x2="dotX(i)" :y2="dotY(i)" stroke="black" stroke-width="2"/>
			<note-dot
				@click.native="clickTonic(i)"
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
		tonic: function(){ return store.state.tonicIdx; },
		intervals: function() { return store.getters.booleanIntervals; },

		modes: function() {
			// Create array of modal interval sets
			var modes = [];
			for (var i = 0, len = this.intervals.length; i < len; i++) {
				if(this.intervals[i]) {
					modes.push(this.intervals.slice(i).concat(this.intervals.slice(0,i)));
				}
			}
			// Remove duplicates
			var set = new Set(modes.map(JSON.stringify));
			modes = Array.from(set).map(JSON.parse);
			// Find Ian Ring numbers and names
			for (var i = 0, len = modes.length; i < len; i++) {
				var modeIntervals = modes[i];
				var num = this.ianRingNumber(modeIntervals);
				modes[i] = {
					intervals: modeIntervals,
					number: num,
					name: this.scaleName(num),
				};
			}
			// Sort by IR number
			modes = modes.sort(function(a,b){
				if(a.number < b.number) {
					return -1;
				} else {
					return (a.number > b.number) ? 1 : 0;
				}
			});
			modes.reverse(); // (prime form last)
			return modes;
		},
	},

	methods: {
		ianRingNumber: function(intervals) {
			var binary = intervals.slice().reverse().join('');
			return parseInt(binary, 2);
		},

		scaleName: function(ianRingNum) {
			var names = scaleNames[ianRingNum];
			if(names === undefined) {
				return 'Scale #' + ianRingNum;
			} else {
				return names[0];
			}
		},

		goToParallel(idx) {
			store.commit('setIntervals', this.modes[idx]['intervals']);
		},
		goToRelative(idx) {
			var relativeIntervals = this.modes[idx].intervals.join('');
			for (var i = 0, len = this.intervals.length; i < len; i++) {
				if(this.intervals[i]) {
					var thisSlice = this.intervals.slice(i).concat(this.intervals.slice(0,i));
					if(relativeIntervals === thisSlice.join('')) {
						store.commit('setTonic', this.tonic + i);
						store.commit('setIntervals', thisSlice);
						break;
					}
				}
			}
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
				<td>{{ mode.name }}</td>
			</tr>
		</table>
	</div>`
});


Vue.component('chords', {
	props: {
		labels: Array,
	},

	computed: {
		tonic: function(){ return store.state.tonicIdx; },
		intervals: function() { return store.getters.booleanIntervals; },

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
		// intervals: P1 m2 M2 m3 M3 P4 A4 P5 m6 M6 m7 M7
		notationSystems.intervals = [
			['P1','d2'], ['m2','A1'], ['M2','d3'], ['m3','A2'], ['M3','d4'], ['P4','A3'],
			['A4','d5'], ['P5','d6'], ['m6','A5'], ['M6','d7'], ['m7','A6'], ['M7','d8']
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
			colorschemes: {
				/*
				rainbowPure: [
					'hsl(0,100%,50%)', 'hsl(30,100%,50%)', 'hsl(60,100%,50%)', 'hsl(90,100%,50%)', 'hsl(120,100%,50%)', 'hsl(150,100%,50%)',
					'hsl(180,100%,50%)', 'hsl(210,100%,50%)', 'hsl(240,100%,50%)', 'hsl(270,100%,50%)', 'hsl(300,100%,50%)', 'hsl(330,100%,50%)'
				],
				rainbowDesat: [
					'hsl(0,90%,50%)', 'hsl(30,90%,50%)', 'hsl(60,90%,50%)', 'hsl(90,90%,50%)', 'hsl(120,90%,50%)', 'hsl(150,90%,50%)',
					'hsl(180,90%,50%)', 'hsl(210,90%,50%)', 'hsl(240,90%,50%)', 'hsl(270,90%,50%)', 'hsl(300,90%,50%)', 'hsl(330,90%,50%)'
				],
				*/
				rainbowHandpicked: [
					'hsl(0,100%,50%)', 'hsl(25,100%,50%)', 'hsl(45,100%,50%)', 'hsl(60,92%,50%)', 'hsl(77,100%,50%)', 'hsl(125,100%,50%)',
					'hsl(180,100%,50%)', 'hsl(205,100%,50%)', 'hsl(240,100%,50%)', 'hsl(270,100%,50%)', 'hsl(292,100%,50%)', 'hsl(320,100%,50%)'
				],
				complimentary: [
					'#ff0000', '#ff6600', '#ff9904', '#ffcc02', '#f6f600', '#66cc02',
					'#049901', '#0db4c2', '#0151d4', '#660099', '#990099', '#cc0099'
				],
				monochrome: ['#f00', '#e00', '#d00', '#c00', '#b00', '#a00', '#900', '#800', '#700', '#600', '#500', '#400'],
				noir: ['#000', '#111', '#222', '#333', '#444', '#555', '#666', '#777', '#888', '#999', '#aaa', '#bbb'],
			},
			colorschemeIdx: 'rainbowHandpicked',
			scaleSearch: null,
			frets: frets,
			showCfg: {global:false, guitar:false, piano:false},
			guitarWidth: window.innerWidth,
			guitarHeight: 200,
			pianoWidth: Math.max(400, window.innerWidth * 0.5),
			pianoHeight: 170,
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
			store.commit('setIntervals', intervals.split('').map(function(x){ return parseInt(x); }));
		}
	},

	computed: {
		width: function(){ return window.innerWidth; },
		height: function(){ return 200; },

		tonicIdx: function(){ return store.state.tonicIdx; },
		intervals: function() { return store.getters.booleanIntervals; },
		tonic: function(){ return store.getters.tonic; },

		colors: function(){ return this.colorschemes[this.colorschemeIdx]; },

		labels: function() {
			//.later: allow selection and save state of preferred enharmonics
			var labels = {};
			for (var system in this.notationSystems) {
				labels[system] = this.notationSystems[system].map(function(enharmonics){ return enharmonics[0]; });
			}
			return labels;
		},

		noteNames: function() { return store.getters.noteNames; },

		permLink: function(){
			var url = window.location.href.split('?')[0];
			url += '?';

			// NOTE: Every param should have corresponding decode logic in beforeMount().
			url += 'tonic='+this.tonicIdx;
			url += '&intervals='+this.intervals.join('');

			return encodeURI(url);
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
			return all.sort(function(a,b){
				if(a.name < b.name) {
					return -1;
				} else {
					return (a.name > b.name) ? 1 : 0;
				}
			});
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

		ianRingScaleName: function(){
			var names = this.scaleNames[this.ianRingNumber];
			if(!names) return "("+this.ianRingNumber+")";
			else return names[0];
		},

		urlParams: function(){ return new URLSearchParams(window.location.search); },

		keyAndScale: function(){ return [this.tonic, this.intervals]; },
	},

	methods: {
		switchToIanRingScale(num) {
			num = parseInt(num);
			var intervals = num.toString(2).split('').reverse().map(function(n){ return parseInt(n); });
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
			var title = 'Taylored Scales - ';
			title += this.tonic;
			var names = this.scaleNames[this.ianRingNumber];
			if(names) {
				var name = names[0];
				title += ' ' + this.scaleNames[this.ianRingNumber][0];
			}
			title += ' (' + this.ianRingNumber + ')';
			document.title = title;

			// Set cookie
			//document.cookie = "tonic=" + this.tonicIdx;
			//document.cookie = "intervals=" + this.intervals.join('');
		},
	},

	template: `<div>
		<div class="cfg-box">
			<button v-on:click="showCfg.global = !showCfg.global">Global Config</button>
			<div v-show="showCfg.global" style="padding:0.5em">
				Colorscheme:
				<div style="padding-left:1em">
					<div
						v-for="(colors, key) in colorschemes"
						v-on:click="colorschemeIdx = key"
						:style="'margin-bottom:3px; border:'+(colorschemeIdx==key ? '3px solid black' : '')+';'"
					>
						<span v-for="color in colors" :style="'background-color:'+color">&nbsp;&nbsp;&nbsp;&nbsp;</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Guitar -->
		<div v-if="intervals">
			<div class="cfg-box">
				<button v-on:click="showCfg.guitar = !showCfg.guitar">Fretboard Config</button>
				<div v-show="showCfg.guitar" style="padding:0.5em">
					Frets: <input type="number" v-model="frets[0]" style="width:5em"/> to <input type="number" v-model="frets[1]" style="width:4em"/>
					<br>
					Width: <button v-for="px in [-100,-50,-10,10,50,100]" v-on:click="guitarWidth += px">{{ (px>0 ? "+" : "") + px }}</button>
					<br>
					Height: <button v-for="px in [-50,-20,-10,10,20,50]" v-on:click="guitarHeight += px">{{ (px>0 ? "+" : "") + px }}</button>
				</div>
			</div>
			<br>
			<guitar
				:svgWidth="guitarWidth"
				:svgHeight="guitarHeight"
				:tonic="tonicIdx"
				:intervals="intervals"
				:frets="frets"
				:labels="noteNames"
				:colors="colors"
			/>
		</div>

		<!-- Scale selection -->
		<div style="display:inline-block; margin:1em;">
			<scale-builder :width="height" :colors="colors"/>
			<br><br>
			<note-wheel :size="height" :colors="colors"/>
		</div>

		<!-- Piano -->
		<div style="display:inline-block; margin:1em; vertical-align:top;">
			<div class="cfg-box">
				<button v-on:click="showCfg.piano = !showCfg.piano">Keyboard Config</button>
				<div v-show="showCfg.piano" style="padding:0.5em">
					Width: <button v-for="px in [-100,-50,-10,10,50,100]" v-on:click="pianoWidth += px">{{ (px>0 ? "+" : "") + px }}</button>
					<br>
					Height: <button v-for="px in [-50,-20,-10,10,20,50]" v-on:click="pianoHeight += px">{{ (px>0 ? "+" : "") + px }}</button>
				</div>
			</div>
			<br>
			<piano
				:x="0"
				:y="0"
				:svgWidth="pianoWidth"
				:svgHeight="pianoHeight"
				:labels="noteNames"
				:colors="colors"
			/>
		</div>

		<br>

		<div style="display:inline-block; margin:1em; vertical-align:top;">
			<h4>Mode Switcher</h4>
			<mode-switcher/>
		</div>

		<div style="display:inline-block; margin:1em; max-width:35em; text-align:center;">
			<h4>{{ tonic + ' ' + ianRingScaleName }}</h4>
			<p style="font-size:0.8em">
				Link to this scale:&nbsp;&nbsp;
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
			<chords :labels="noteNames"/>
		</div>

		<!-- Find a scale -->
		<div style="display:inline-block">
			<h4>Scale Finder</h4>
			<input type="search" v-model="scaleSearch" placeholder="Scale name"/>
			<div style="border:1px solid black; font-size:0.75em; height:200px; width:500px; overflow-y:scroll; font-family:'Lucida Console', Monaco, monospace;">
				<div v-for="scale in filteredIanRingScales" v-on:click="switchToIanRingScale(scale.num)">
					{{ scale.name }}
				</div>
			</div>
		</div>

		<div v-if="0"><hr><button v-on:click="test">test</button></div>
	</div>`
});



// App controller
new Vue({
	el: '#app',
});
