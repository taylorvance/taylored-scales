// Scale Mixin
var scale = {
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

		return {
			notationSystems: notationSystems,
			tonic: 0, // C
			intervals: [1,0,1,0,1,1,0,1,0,1,0,1], // Major
		};
	},

	computed: {
		labels: function() {
			//.later: allow selection and save state of preferred enharmonics
			var labels = {};
			for (var system in this.notationSystems) {
				labels[system] = this.notationSystems[system].map(enharmonics => enharmonics[0]);
			}
			return labels;
		},
	},

	methods: {
		toggleInterval(i) {
			this.intervals.splice(i, 1, (this.intervals[i] ? 0 : 1));
		},
	},
};



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
	props: {
		x: {type: Number, required: true},
		y: {type: Number, required: true},
		svgWidth: {type: Number, default: 1000},
		svgHeight: {type: Number, default: 200},
		frets: {
			type: Array,
			default: function() { return [0,22]; } // 0 to 22
		},
		tuning: {
			type: Array,
			default: function() { return [4,9,2,7,11,4]; } // Standard: EADGBE
		},
		tonic: {type: Number, default: 0},
		labels: Array,
		intervals: Array,
		colors: Array,
	},

	computed: {
		width: function() { return this.svgWidth - 80; },
		height: function() { return this.svgHeight - 40; },
		fretAry: function() {
			var ary = [];
			for (var fret = this.frets[0]; fret <= this.frets[1]; fret++) {
				ary.push(fret);
			}
			return ary;
		},
		fretDistance: function() { return this.width / this.fretAry.length; },
		stringDistance: function() { return this.height / (this.tuning.length - 1); },
		noteOffset: function() { return this.fretDistance / 4; },
		noteRadius: function() { return Math.min(this.fretDistance, this.stringDistance) / 3; },
		wrappedIntervals: function(){
			var normal = [0,1,2,3,4,5,6,7,8,9,10,11];
			var wrapIdx = 12 - this.tonic;
			return normal.slice(wrapIdx).concat(normal.slice(0, wrapIdx));
		},
	},

	methods: {
		fretX(fret) { return this.x + fret * this.width / (this.fretAry.length - 1); },
		stringY(string) { return this.y + this.height - (string - 1) * this.height / (this.tuning.length - 1); },
		noteX(fret) { return this.fretX(fret) - this.noteOffset; },
		test() { console.log(this.tuning); },
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
		<g v-for="(intervalIdx, i) in tuning" :key="intervalIdx.id">
			<note-dot
				v-for="(fret, j) in fretAry"
				v-if="intervals[wrappedIntervals[(intervalIdx + j) % 12]]"
				:key="fret.id"
				:x="noteX(j)"
				:y="stringY(i + 1)"
				:r="noteRadius"
				:label="labels[(intervalIdx + j) % 12]"
				:color="colors[wrappedIntervals[(intervalIdx + j) % 12]]"
			/>
		</g>
	</svg>`
});


Vue.component('scale-builder', {
	props: {
		width: {type: Number, required: true},
		intervals: {type: Array, required: true},
		colors: Array,
		labels: Array,
	},

	computed: {
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
			this.$emit('toggle-interval', i);
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
		tonic: {type: Number, required: true},
		intervals: {type: Array, required: true},
		labels: {type: Array, required: true},
		colors: Array,
		circleOf: {
			validator: function(value) { return [2,4,5].indexOf(value) !== -1; },
			default: 2, // circle of 2nds (chromatic)
		},
	},

	computed: {
		width: function(){ return this.size; },
		height: function(){ return this.size; },
		buttonRadius: function(){ return this.width * 0.08; },
		cx: function(){ return this.width / 2; },
		cy: function(){ return this.height / 2; },
		r: function(){ return Math.min(this.width, this.height) / 2 - this.buttonRadius - (this.strokeWidth/2); },
		wrappedIntervals: function(){
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
			this.$emit('tonic', idx);
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


Vue.component('taylored-scale', {
	mixins: [scale],

	data: function() {
		return {
			scaleNames: scaleNames,//.hack (other file)
			labelType: 'degrees',
			colorschemes: {
				rainbow: ['#ff0000','#ff8000','#f8f800','#88ff00','#00f800','#00ffc0','#00f8f8','#0080ff','#0000ff','#8000ff','#ff00ff','#ff0080'],
				//loweredRaised //.3 diff colors: major, lowered, and raised notes (maybe one color for tonic too)
			},
		};
	},

	beforeMount: function() {
		// Set tonic
		var tonic = this.getParam('tonic');
		if(tonic) {
			tonic = parseInt(tonic);
			if(tonic < 0) tonic = 0;
			this.tonic = tonic % 12;
		}

		// Calculate intervals
		var intervals = this.getParam('intervals');
		if(intervals) {
			this.intervals = intervals.split('').map(x => parseInt(x));
			for (var i = 0, len = 12-this.intervals.length; i < len; i++) {
				this.intervals.push(0);
			}
		}
	},

	computed: {
		width: function(){ return window.innerWidth; },
		height: function(){ return this.width / 7; },
		colors: function(){ return this.colorschemes.rainbow; },

		ianRingNumber: function(){
			var binary = this.intervals.slice().reverse().join('');
			return parseInt(binary, 2);
		},

		mainScales: function(){
			var scaleNums = [273, 585, 661, 859, 1193, 1257, 1365, 1371, 1387, 1389, 1397, 1451, 1453, 1459, 1485, 1493, 1499, 1621, 1643, 1709, 1717, 1725, 1741, 1749, 1753, 1755, 2257, 2275, 2457, 2475, 2477, 2483, 2509, 2535, 2731, 2733, 2741, 2773, 2777, 2869, 2901, 2925, 2925, 2989, 2997, 3055, 3411, 3445, 3549, 3669, 3765, 4095];
			scaleNums.sort(function(a,b){
				if(this.scaleNames[a] < this.scaleNames[b]) {
					return -1;
				} else {
					return parseInt(this.scaleNames[a] > this.scaleNames[b]);
				}
			});
			return scaleNums;
		},

		urlParams: function(){ return new URLSearchParams(window.location.search); }
	},

	methods: {
		updateTonic(idx) { this.tonic = idx; },

		switchToIanRingScale(num) {
			var intervals = num.toString(2).split('').reverse().map(n => parseInt(n));
			for (var i = intervals.length; i < 12; i++) {
				intervals.push(0);
			}
			this.intervals = intervals;
		},

		getParam(name) {
			return this.urlParams.get(name);
		},

		test() { console.log(this.getParam('tonic')); },
	},

	template: `<div>
		<div>
			<guitar
				:x="40"
				:y="25"
				:svgWidth="width"
				:svgHeight="height"
				:tonic="tonic"
				:labels="labels.letters"
				:intervals="intervals"
				:colors="colors"
			/>
		</div>

		<!-- Scale selection -->
		<div style="display:inline-block; margin:1em;">
			<scale-builder :width="height" :labels="labels.degrees" :tonic="tonic" :intervals="intervals" :colors="colors" @toggle-interval="toggleInterval"/>
			<br><br>
			<note-wheel :size="height" :tonic="tonic" :intervals="intervals" :labels="labels.letters" :colors="colors" @tonic="updateTonic"/>
		</div>

		<div v-if="false" style="display:inline-block; margin:1em; vertical-align:top;">
			<label v-for="(labels, type) in notationSystems" style="margin-right:2em">
				<input type="radio" :value="type" v-model="labelType">
				{{ type }}
			</label>
		</div>

		<p>Scale Name(s):&nbsp;&nbsp;<i>{{ scaleNames[ianRingNumber] }}</i></p>
		<p>Learn more about <a :href="'https://ianring.com/musictheory/scales/' + ianRingNumber" target="_blank">scale {{ ianRingNumber }}</a> at Ian Ring's website.</p>
		<p>
			<div style="border:1px solid black; height:200px; width:350px; overflow-y:scroll; font-family:'Lucida Console', Monaco, monospace;">
				<div v-if="scaleNames[num]" v-on:click="switchToIanRingScale(num)" v-for="num in mainScales">
					{{ scaleNames[num][0] }}
				</div>
			</div>
		</p>

		<hr><button v-on:click="test">test</button>
	</div>`
});



// App controller
new Vue({
	el: '#app',
});
