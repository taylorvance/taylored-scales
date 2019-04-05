// Vuex data store
const store = new Vuex.Store({
	state: {
		tonicIdx: 0, // C
		tonicOptions: [
			['C'], ['C#','Db'], ['D'], ['D#','Eb'], ['E'], ['F'],
			['F#','Gb'], ['G'], ['G#','Ab'], ['A'], ['A#','Bb'], ['B']
		],
		tonicEnharmShift: 0,
		intervalSet: [ // default to Major scale
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
		intervalEnharmShift: [0,0,0,0,0,0,0,0,0,0,0,0],
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

			state.tonicEnharmShift = 0; // important, if somewhat hacky
		},
		enharmonicizeTonic(state) {
			state.tonicEnharmShift = (state.tonicEnharmShift + 1) % state.tonicOptions[state.tonicIdx].length;
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
			var shift = (state.intervalEnharmShift[idx] + 1) % state.intervalSet[idx].enharmonics.length;
			state.intervalEnharmShift.splice(idx, 1, shift);
		},
	},

	getters: {
		tonic: function(state, getters) {
			return getters.tonicOptions[state.tonicIdx];
		},
		tonicOptions: function(state) {
			var opts = [];
			for (var i = 0, len = state.tonicOptions.length; i < len; i++) {
				var enharmIdx = (i === state.tonicIdx ? state.tonicEnharmShift : 0);
				opts.push(state.tonicOptions[i][enharmIdx]);
			}
			return opts;
		},

		booleanIntervals: function(state) {
			return state.intervalSet.map(function(interval){ return interval.on ? 1 : 0; });
		},

		intervalNames: function(state) {
			return state.intervalSet.map(function(interval, i) {
				return interval.enharmonics[state.intervalEnharmShift[i]];
			});
		},

		noteNames: function(state, getters) {
			var names = [];

			var tonicLetter = getters.tonic[0];
			var allLetters = 'CDEFGABCDEFGABC';
			var tonicLetterIdx = allLetters.indexOf(tonicLetter);

			state.intervalSet.forEach(function(interval, i) {
				var number = parseInt(interval.enharmonics[state.intervalEnharmShift[i]][1]);
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
		},

		romanNumerals: function(state) {
			var numerals = [];

			var intervalMap = {
				P1:'I',
				m2:'bII', A1:'#I',
				M2:'II', d3:'bbIII',
				m3:'bIII', A2:'#II',
				M3:'III', d4:'bIV',
				P4:'IV', A3:'#III',
				A4:'#IV', d5:'bV',
				P5:'V', d6:'bbVI',
				m6:'bVI', A5:'#V',
				M6:'VI', d7:'bVII',
				m7:'bVII', A6:'#VI',
				M7:'VII', d8:'bVIII',
			};

			state.intervalSet.forEach(function(interval, i) {
				numerals.push(intervalMap[interval.enharmonics[state.intervalEnharmShift[i]]]);
			});

			var wrapIdx = state.pitchClasses.length - state.tonicIdx;
			return numerals.slice(wrapIdx).concat(numerals.slice(0, wrapIdx));
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
		fontSize: function() {
			var px = this.r * 1.2;
			var over = this.effectiveWidth - 2;
			if(over > 0) px -= (over * 3);
			return px + 'px';
		},
		effectiveWidth: function() {
			var width = this.label.length;
			// "I"s only count for half
			width -= ((this.label.match(/I/gi) || []).length / 2);
			return width;
		},
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
		return {x:50, y:25};
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
		noteRadius: function() { return Math.min(this.fretDistance, this.stringDistance) * 0.38; },
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
		colorWholeKey: {type: Boolean, default: false},
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
		color(i) {
			if(this.intervals[this.wrappedIntervals[i]])
				return this.colors[this.wrappedIntervals[i]];
			else
				return false;
		},
		test() { console.log(this.tuning); },
	},

	template: `<svg :width="svgWidth" :height="svgHeight">
		<!-- White keys -->
		<g v-for="(interval, i) in whiteKeys" :key="interval.id">
			<rect
				:x="whiteX(i)"
				:y="strokeWidth"
				:width="whiteWidth"
				:height="height"
				:fill="colorWholeKey ? (color(interval) || 'white') : 'white'"
				stroke="black"
				:stroke-width="strokeWidth"
			/>
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
			<rect
				:x="blackX(i)"
				:y="strokeWidth"
				:width="blackWidth"
				:height="blackHeight"
				:fill="colorWholeKey ? (color(interval) || '#333') : '#333'"
				stroke="black"
				:stroke-width="strokeWidth"
			/>
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
		intervalSet: function() { return store.state.intervalSet; },
		labels: function() { return store.getters.intervalNames; },
		buttonRadius: function(){ return this.width / 16; },
		height: function(){ return this.buttonRadius * 7.5; },
	},

	methods: {
		intervalX(i) {
			var padding = this.buttonRadius;
			var paddedWidth = this.width - 2 * padding;
			var relX = i<5 ? i : i+1;
			return padding + paddedWidth * relX / this.intervalSet.length;
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
		<g v-for="(interval, i) in intervalSet" :key="interval.id">
			<note-dot
				@click.native="toggleInterval(i)"
				:x="intervalX(i)"
				:y="height/2 + intervalYoffset(i)"
				:r="buttonRadius"
				:label="labels[i]"
				:color="fill(i)"
				:opacity="interval.on ? 1 : 0.25"
				style="cursor:pointer"
			/>
			<text
				v-show="interval.enharmonics.length > 1"
				v-on:click="enharmonicizeInterval(i)"
				:x="intervalX(i)"
				:y="height/2 + intervalYoffset(i) * 3"
				:fill="fill(i)"
				:opacity="interval.on ? 1 : 0.25"
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
	},

	computed: {
		labels: function(){ return store.getters.tonicOptions; },
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
				store.commit('enharmonicizeTonic');
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
	props: {
		labels: Array,
		sortBy: {type: String, default: 'primeForm'},//.enum this
	},

	computed: {
		tonic: function(){ return store.state.tonicIdx; },
		intervals: function() { return store.getters.booleanIntervals; },

		wrappedIntervals: function(){//.normalize this dup code (THIS ONE IS SLIGHTLY DIFFERENT FROM THE OTHERS)
			var normal = [0,1,2,3,4,5,6,7,8,9,10,11];
			var wrapIdx = this.tonic - 12;
			return normal.slice(wrapIdx).concat(normal.slice(0, wrapIdx));
		},

		modes: function() {
			// Create array of modal interval sets.
			var modes = [];
			for (var i = 0, len = this.intervals.length; i < len; i++) {
				if(!this.intervals[i]) continue;

				var modeIntervals = this.intervals.slice(i).concat(this.intervals.slice(0,i));

				// Make sure it's not already in the array.
				var already = false;
				for (var j = 0, modesLen = modes.length; j < modesLen; j++) {
					if(JSON.stringify(modes[j].intervals) == JSON.stringify(modeIntervals)) {
						already = true;
						break;
					}
				}
				if(already) continue;

				var num = this.ianRingNumber(modeIntervals);
				modes.push({
					relativeIdx: i,
					intervals: modeIntervals,
					number: num,
					name: this.scaleName(num),
				});
			}

			if(this.sortBy == 'primeForm') {
				// Sort by IR number.
				modes = modes.sort(function(a,b){
					if(a.number < b.number) {
						return -1;
					} else {
						return (a.number > b.number) ? 1 : 0;
					}
				});
				modes.reverse(); // (prime form (darkest) last)
			}

			// by default sort by mode order
			return modes;
		},
	},

	methods: {
		ianRingNumber: function(intervals) {//.normalize?
			var binary = intervals.slice().reverse().join('');
			return parseInt(binary, 2);
		},

		scaleName: function(ianRingNum) {
			var names = scaleNames[ianRingNum];//.hack (other file)
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
					<button
						v-on:click="goToParallel(i)"
						style='cursor: pointer; font-family: "Times New Roman", Times, serif;'
						:disabled="wrappedIntervals[mode.relativeIdx] == tonic"
					>{{ labels[tonic] }}</button>
					<button
						v-on:click="goToRelative(i)"
						style='cursor: pointer; font-family: "Times New Roman", Times, serif;'
						:disabled="wrappedIntervals[mode.relativeIdx] == tonic"
					>{{ labels[wrappedIntervals[mode.relativeIdx]] }}</button>
				</td>
				<td>{{ mode.name }}</td>
			</tr>
		</table>
	</div>`
});


Vue.component('chords', {
	props: {
		labels: Array,
		showSus: {type: Boolean, default: false},
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
			};
			if(this.showSus) {
				combos["sus"] = [0,5,7];
				combos["sus2"] = [0,2,7];
			}
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
			<b>{{ type }}</b>
			<div v-for="(chords, rootIdx) in chordGroups[type]">
				<span v-for="chord in chords" style="margin-right:1.5em">{{ chord }}</span>
			</div>
		</div>
	</div>`
});


Vue.component('taylored-scale', {
	data: function() {
		var cfg = {
			global: {showCfg:false},
			guitar: {showCfg:false},
			piano: {showCfg:false},
			modes: {showCfg:false},
			chords: {showCfg:false},
			misc: {showAliases:false},
		};
		var cookieList = [];

		var val;

		// Global
		val = this.getCookie('cfg.global.useRoman');
		cfg.global.useRoman = (val===null ? false : (val=='true'));
		cookieList.push('cfg.global.useRoman');

		val = this.getCookie('cfg.global.colorscheme');
		cfg.global.colorscheme = (val===null ? 'spectrum' : val);
		cookieList.push('cfg.global.colorscheme');

		val = this.getCookie('cfg.global.customColors');
		cfg.global.customColors = (val===null ? Array(12).fill('#aaccee') : JSON.parse(val));
		cookieList.push('cfg.global.customColors');

		// Guitar
		val = this.getCookie('cfg.guitar.width');
		cfg.guitar.width = (val===null ? window.innerWidth*0.96 : parseInt(val));
		cookieList.push('cfg.guitar.width');

		val = this.getCookie('cfg.guitar.height');
		cfg.guitar.height = (val===null ? 200 : parseInt(val));
		cookieList.push('cfg.guitar.height');

		val = this.getCookie('cfg.guitar.startFret');
		cfg.guitar.startFret = (val===null ? 0 : parseInt(val));
		cookieList.push('cfg.guitar.startFret');

		val = this.getCookie('cfg.guitar.endFret');
		cfg.guitar.endFret = (val===null ? Math.floor(window.innerWidth/64) : parseInt(val));
		cookieList.push('cfg.guitar.endFret');

		// Piano
		val = this.getCookie('cfg.piano.width');
		cfg.piano.width = (val===null ? Math.max(300,window.innerWidth*0.5) : parseInt(val));
		cookieList.push('cfg.piano.width');

		val = this.getCookie('cfg.piano.height');
		cfg.piano.height = (val===null ? 150 : parseInt(val));
		cookieList.push('cfg.piano.height');

		val = this.getCookie('cfg.piano.octaves');
		cfg.piano.octaves = (val===null ? 2 : parseInt(val));
		cookieList.push('cfg.piano.octaves');

		val = this.getCookie('cfg.piano.colorWholeKey');
		cfg.piano.colorWholeKey = (val===null ? true : (val=='true'));
		cookieList.push('cfg.piano.colorWholeKey');

		// Modes
		val = this.getCookie('cfg.modes.sortBy');
		cfg.modes.sortBy = (val===null ? 'primeForm' : val);
		cookieList.push('cfg.modes.sortBy');

		// Chords
		val = this.getCookie('cfg.chords.showSus');
		cfg.chords.showSus = (val===null ? false : (val=='true'));
		cookieList.push('cfg.chords.showSus');


		return {
			allScaleNames: scaleNames,//.hack (other file)
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
				spectrum: [
					'hsl(0,100%,50%)', 'hsl(25,100%,50%)', 'hsl(45,100%,50%)', 'hsl(60,92%,50%)', 'hsl(77,100%,50%)', 'hsl(125,100%,50%)',
					'hsl(180,100%,50%)', 'hsl(205,100%,50%)', 'hsl(240,100%,50%)', 'hsl(270,100%,50%)', 'hsl(292,100%,50%)', 'hsl(320,100%,50%)'
				],
				complimentary: [
					'#ff0000', '#ff6600', '#ff9904', '#ffcc02', '#f6f600', '#66cc02',
					'#049901', '#0db4c2', '#0151d4', '#660099', '#990099', '#cc0099'
				],
				tonicSeventh: [
					'#e00', '#ace', '#ace', '#22b', '#24f', '#ace',
					'#ace', '#0c0', '#ace', '#ace', '#d90', '#ec0'
				],
				/*
				darkAccident: [
					'hsl(0,100%,50%)', 'hsl(15,100%,40%)', 'hsl(30,100%,50%)', 'hsl(45,100%,40%)', 'hsl(60,92%,50%)', 'hsl(90,100%,45%)',
					'hsl(170,100%,25%)', 'hsl(210,100%,60%)', 'hsl(220,100%,35%)', 'hsl(250,100%,65%)', 'hsl(270,100%,35%)', 'hsl(290,100%,60%)'
				],
				monochrome: ['#f00', '#e00', '#d00', '#c00', '#b00', '#a00', '#900', '#800', '#700', '#600', '#500', '#400'],
				noir: ['#000', '#111', '#222', '#333', '#444', '#555', '#666', '#777', '#888', '#999', '#aaa', '#bbb'],
				whiteBlackKeys: ['#aaa', '#555', '#aaa', '#555', '#aaa', '#aaa', '#555', '#aaa', '#555', '#aaa', '#555', '#aaa'],
				black: ['#000', '#000', '#000', '#000', '#000', '#000', '#000', '#000', '#000', '#000', '#000', '#000'],
				*/
				custom: cfg.global.customColors,
			},
			scaleSearch: null,
			cfg: cfg,
			cookieList: cookieList,
		};
	},

	beforeMount: function() {
		// Set tonic
		var gotTonic = this.getParam('tonic');
		if(gotTonic) {
			store.commit('setTonic', gotTonic);
		}
		// Set intervals
		var gotIntervals = this.getParam('intervals');
		if(gotIntervals) {
			store.commit('setIntervals', gotIntervals.split('').map(function(x){ return parseInt(x); }));
		}

		// Enharmonicize tonic if necessary
		for (var i = 0, len = parseInt(this.getParam('tes')); i < len; i++) {
			store.commit('enharmonicizeTonic');
		}
		// Enharmonicize intervals if necessary
		var enharms = this.getParam('ies');
		if(enharms) {
			enharms = enharms.split('');
			for (var intervalIdx = 0, len1 = enharms.length; intervalIdx < len1; intervalIdx++) {
				for (var j = 0, len2 = parseInt(enharms[intervalIdx]); j < len2; j++) {
					store.commit('enharmonicizeInterval', intervalIdx);
				}
			}
		}

		// Set tab title if tonic or intervals were in the params.
		if(gotTonic || gotIntervals) {
			document.title = 'Taylored Scales - ' + this.keyAndScale();
		}
	},

	computed: {
		width: function(){ return window.innerWidth; },
		height: function(){ return 200; },

		tonicIdx: function(){ return store.state.tonicIdx; },
		tonic: function(){ return store.getters.tonic; },

		intervals: function() { return store.getters.booleanIntervals; },
		intervalNames: function() { return store.getters.intervalNames; },

		colors: function(){ return this.colorschemes[this.cfg.global.colorscheme]; },

		noteNames: function() { return store.getters.noteNames; },
		romanNumerals: function() { return store.getters.romanNumerals; },

		permLink: function(){
			// NOTE: every param should have corresponding decode logic in beforeMount()
			var url = window.location.href.split('?')[0];
			url += '?';

			url += 'tonic='+this.tonicIdx;
			url += '&intervals='+this.intervals.join('');

			// if the tonic is shifted, add it
			if(store.state.tonicEnharmShift > 0) url += '&tes='+store.state.tonicEnharmShift;
			// if any interval shifts are non-zero, add them
			var ies = store.state.intervalEnharmShift.join('');
			if(ies !== Array(store.state.intervalEnharmShift.length).fill('0').join('')) url += '&ies='+ies;

			return encodeURI(url);
		},

		ianRingNumber: function(){
			var binary = this.intervals.slice().reverse().join('');
			return parseInt(binary, 2);
		},

		scaleNames: function(){
			return this.allScaleNames[this.ianRingNumber] || [];
		},
		scaleName: function(){
			var names = this.scaleNames;
			if(!names || !names[0]) return "#"+this.ianRingNumber;
			else return names[0];
		},

		allIanRingScales: function(){
			var all = [];
			for (num in this.allScaleNames) {
				for (i in this.allScaleNames[num]) {
					all.push({num: num, name: this.allScaleNames[num][i]});
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

		cookies: function(){
			var out = {};
			for (var i = 0, len = this.cookieList.length; i < len; i++) {
				var keyStr = this.cookieList[i];
				var keyAry = keyStr.split('.');
				var val = this;
				for (var j = 0; j < keyAry.length; j++) {
					val = val[keyAry[j]];
				}
				out[keyStr] = val;
			}
			return JSON.parse(JSON.stringify(out));
		},
	},

	methods: {
		switchToIanRingScale(num) {
			num = parseInt(num);
			var intervals = num.toString(2).split('').reverse().map(function(n){ return parseInt(n); });
			store.commit('setIntervals', intervals);
		},

		urlParams: function() { return new URLSearchParams(window.location.search); },

		getParam(name) { return this.urlParams().get(name); },
		setParam(name, value) {
			var params = this.urlParams();
			params.set('tonic', value);
			window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
		},

		getCookie(key) {
			if(typeof(Storage) !== "undefined") {
				var val = localStorage.getItem(key);
				if(val !== null && val !== undefined) {
					return val;
				}
			}
			return null;
		},
		setCookie(key, val) {
			if(typeof(Storage) !== "undefined") {
				if(Array.isArray(val) || (typeof val === "object" && val !== null)) {
					val = JSON.stringify(val);
				}
				localStorage.setItem(key, val);
			}
		},
		resetConfig() {
			if(confirm("Are you sure you want to reset the configuration?  This will erase all of your custom settings and reload the page.")) {//.add "including saved scales"
				localStorage.clear();
				window.location.href = this.permLink;
			}
		},

		keyAndScale: function() { return this.tonic + ' ' + this.scaleName; },

		test() {
			console.log('cookie', localStorage);
		},
	},

	watch: {
		cookies: {
			deep: true,
			handler: function(newval, oldval) {
				if(typeof(Storage) !== "undefined") {
					for(key in newval) {
						if(newval[key] !== oldval[key]) {
							//console.log('setting cookie', key, oldval[key], newval[key]);
							this.setCookie(key, newval[key]);
						}
					}
				}
			},
		},
	},

	template: `<div>
		<div v-if="0"><hr><button v-on:click="test">test</button></div>

		<div>
		<div class="cfg-box">
			<button v-on:click="cfg.global.showCfg = !cfg.global.showCfg">Global Config</button>
			<div v-show="cfg.global.showCfg" style="padding:0.5em">
				<button v-on:click="resetConfig()"><b>RESET CONFIG</b></button>
				<br><br>
				<label><input type="checkbox" v-model="cfg.global.useRoman"/> Use Roman Numerals</label>
				<br>
				Colorscheme:
				<div style="padding-left:1em">
					<br>
					<div style="display:inline-block">
						<div
							v-for="(colors, key) in colorschemes"
							v-on:click="cfg.global.colorscheme = key"
							:style="'margin-bottom:3px; border:'+(cfg.global.colorscheme==key ? '3px solid #555' : '')+';'"
						>
							<span v-for="color in colors" :style="'background-color:'+color">&nbsp;&nbsp;&nbsp;&nbsp;</span>
						</div>
					</div>
					<div v-show="cfg.global.colorscheme == 'custom'">
						Pick your custom colors:
						<span v-for="(color, i) in cfg.global.customColors">
							&nbsp;
							<label>
								{{ intervalNames[i] }}
								<input type="color" v-model="cfg.global.customColors[i]" style="max-width:5em"/>
							</label>
						</span>
					</div>
				</div>
			</div>
		</div>
		</div>

		<!-- Scale name -->
		<div style="margin:1em">
			<h2 style="margin-bottom:0.5em; white-space:nowrap;">{{ keyAndScale() }}</h2>
			<p style="font-size:0.8em">
				<button :disabled="scaleNames.length <= 1" v-on:click="cfg.misc.showAliases = !cfg.misc.showAliases">
					other names for this scale
				</button>
				<div v-show="cfg.misc.showAliases" style="font-size:0.8em">
					<span v-for="(name, i) in scaleNames" v-show="i > 0" style="white-space:nowrap">
						{{ name }}
						<span v-if="i != scaleNames.length - 1" style="white-space:normal">
							&nbsp;&mdash;&nbsp;
						</span>
					</span>
				</div>
			</p>
			<p style="font-size:0.7em">
				Permanent* link: <a :href="permLink">{{ permLink }}</a>
			</p>
			<p style="font-size:0.8em">
				<i>Learn more about <a :href="'https://ianring.com/musictheory/scales/' + ianRingNumber" target="_blank">scale {{ ianRingNumber }}</a> from Ian Ring</i>
			</p>
		</div>

		<!-- Scale selector -->
		<div style="display:inline-block; margin:1em;">
			<scale-builder :width="height" :colors="colors"/>
			<br><br>
			<note-wheel :size="height" :colors="colors"/>
		</div>

		<!-- Piano -->
		<div style="display:inline-block; margin:1em; vertical-align:top;">
			<div class="cfg-box">
				<button v-on:click="cfg.piano.showCfg = !cfg.piano.showCfg">Piano Config</button>
				<div v-show="cfg.piano.showCfg" style="padding:0.5em">
					Width: <button v-for="px in [-100,-50,-10,10,50,100]" v-on:click="cfg.piano.width += px">{{ (px>0 ? "+" : "") + px }}</button>
					<br>
					Height: <button v-for="px in [-50,-20,-10,10,20,50]" v-on:click="cfg.piano.height += px">{{ (px>0 ? "+" : "") + px }}</button>
					<br>
					Octaves: 
					<label v-for="num in [1,2,3,4]">&nbsp;<input type="radio" :value="num" v-model="cfg.piano.octaves"/> {{ num }} </label>
					<br>
					<label><input type="checkbox" v-model="cfg.piano.colorWholeKey"/> Color whole key</label>
				</div>
			</div>
			<br>
			<piano
				:x="0"
				:y="0"
				:svgWidth="cfg.piano.width"
				:svgHeight="cfg.piano.height"
				:labels="cfg.global.useRoman ? romanNumerals : noteNames"
				:colors="colors"
				:colorWholeKey="cfg.piano.colorWholeKey"
				:octaves="cfg.piano.octaves"
			/>
		</div>

		<!-- Guitar -->
		<div v-if="intervals">
			<div class="cfg-box">
				<button v-on:click="cfg.guitar.showCfg = !cfg.guitar.showCfg">Guitar Config</button>
				<div v-show="cfg.guitar.showCfg" style="padding:0.5em">
					Frets: <input type="number" v-model="cfg.guitar.startFret" style="width:4em"/> to <input type="number" v-model="cfg.guitar.endFret" style="width:4em"/>
					<br>
					Width: <button v-for="px in [-100,-50,-10,10,50,100]" v-on:click="cfg.guitar.width += px">{{ (px>0 ? "+" : "") + px }}</button>
					<br>
					Height: <button v-for="px in [-50,-20,-10,10,20,50]" v-on:click="cfg.guitar.height += px">{{ (px>0 ? "+" : "") + px }}</button>
				</div>
			</div>
			<br>
			<guitar
				:svgWidth="cfg.guitar.width"
				:svgHeight="cfg.guitar.height"
				:tonic="tonicIdx"
				:intervals="intervals"
				:frets="[cfg.guitar.startFret, cfg.guitar.endFret]"
				:labels="cfg.global.useRoman ? romanNumerals : noteNames"
				:colors="colors"
			/>
		</div>

		<br>

		<div style="display:inline-block; margin:1em; vertical-align:top;">
			<div class="cfg-box">
				<button v-on:click="cfg.modes.showCfg = !cfg.modes.showCfg">Mode Switcher Config</button>
				<div v-show="cfg.modes.showCfg" style="padding:0.5em">
					Sorting:
					<label v-for="(val, key) in {primeForm:'Prime form', mode:'Mode order'}">&nbsp;<input type="radio" :value="key" v-model="cfg.modes.sortBy"/> {{ val }} </label>
				</div>
			</div>
			<mode-switcher :labels="cfg.global.useRoman ? romanNumerals : noteNames" :sortBy="cfg.modes.sortBy"/>
		</div>

		<div style="display:inline-block; margin:1em; vertical-align:top;">
			<div class="cfg-box">
				<button v-on:click="cfg.chords.showCfg = !cfg.chords.showCfg">Chords Config</button>
				<div v-show="cfg.chords.showCfg" style="padding:0.5em">
					<label><input type="checkbox" v-model="cfg.chords.showSus"/> Show sus chords</label>
				</div>
			</div>
			<chords :showSus="cfg.chords.showSus" :labels="cfg.global.useRoman ? romanNumerals : noteNames" style='font-family: "Times New Roman", Times, serif'/>
		</div>

		<!-- Find a scale -->
		<div style="display:inline-block; margin:1em; vertical-align:top;">
			<h4>Scale Finder</h4>
			<input type="search" v-model="scaleSearch" placeholder="Scale name"/>
			<div style="border:1px solid black; font-size:0.75em; height:200px; max-width:500px; overflow:scroll; font-family:'Lucida Console', Monaco, monospace;">
				<div v-for="scale in filteredIanRingScales" v-on:click="switchToIanRingScale(scale.num)">
					{{ scale.name }}
				</div>
			</div>
			<i style="color:gray; font-size:0.8em;">
				Scale list (mostly) courtesy of Ian Ring's <a href="https://github.com/ianring/PHPMusicTools" target="_blank">PHPMusicTools</a>
			</i>
		</div>
	</div>`
});



// App controller
new Vue({
	el: '#app',
});
