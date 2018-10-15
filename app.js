//.del if not using
var wrapAtIndex = function(ary, idx) {
	return ary.slice(idx).concat(ary.slice(0,idx));
}


Vue.component('fret', {
	props: ['x1', 'y1', 'x2', 'y2', 'num'], //.prob just need one x,y and one length var
	template: `<g class="fret">
		<line :x1="x1" :y1="y1" :x2="x2" :y2="y2"/>
		<text v-if="num !== undefined" :x="x1" :y="y1 - 15">
			{{ num }}
		</text>
	</g>`
});


Vue.component('string', {
	props: ['x1', 'y1', 'x2', 'y2', 'note'], //.prob just need one x,y and one length var
	template: `<g class="string">
		<line :x1="x1" :y1="y1" :x2="x2" :y2="y2"/>
		<text v-if="false && note !== undefined" :x="x1 - 15" :y="y1">
			{{ note.toUpperCase() }}
		</text>
	</g>`
});


Vue.component('note-dot', {
	props: {
		x: {type: Number, required: true},
		y: {type: Number, required: true},
		r: {type: Number, required: true},
		letter: String,
		note: {
			type: Object,
			required: true
		},
	},
	computed: {
		fontSize: function() { return this.r * 1.2; },
	},
	template: `<g class="note-dot">
		<circle :cx="x" :cy="y" :r="r" :fill="note.color"/>
		<text :x="x" :y="y" :style="{'font-size':fontSize, 'font-weight':'bold'}">
			{{ note.label }}
		</text>
	</g>`
});


Vue.component('guitar', {
	data: {
	},

	props: {
		x: {type: Number, required: true},
		y: {type: Number, required: true},
		width: {type: Number, default: 1000},
		height: {type: Number, default: 100},
		frets: {
			type: Array,
			default: function() { return [0,22]; }
		},
		tuning: {
			type: Array,
			default: function() { return ['e','a','d','g','b','e']; }
		},
		root: String,
		degrees: {
			type: Array,
			default: function() { return [0,2,4,5,7,9,11]; }
		},
	},

	computed: {
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
	},

	methods: {
		fretX(num) { return this.x + num * this.width / (this.fretAry.length - 1); },
		stringY(num) { return this.y + this.height - (num - 1) * this.height / (this.tuning.length - 1); },
		test() { console.log(this.tuning); },
	},

	template: `<g>
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

		<fret v-for="(fret, i) in fretAry" :key="fret.id" :x1="fretX(i)" :y1="y" :x2="fretX(i)" :y2="y + height" :num="fret"/>

		<string v-for="(note, i) in tuning" :key="note.id" :x1="x" :y1="stringY(i + 1)" :x2="x + width" :y2="stringY(i + 1)" :note="note"/>

		<note-dot
			v-for="(note, i) in notes"
			v-if="[0,2,4,5,7,9,11].includes(i)"
			:key="note.id"
			:x="fretX(5+i) - noteOffset"
			:y="stringY(4)"
			:r="noteRadius"
			:note="{label:note.interval, color:note.color}"
		/>
	</g>`
});


Vue.component('taylored-scale', {
	data: {
	},

	props: {
		width: {type: Number, default: 1200},
		height: {type: Number, default: 550},
		frets: Array,
		tuning: Array,
	},

	computed: {
	},

	methods: {
		test() { console.log('hi'); },
	},

	template: `<svg :width="width" :height="height">
		<rect :width="width" :height="height" style="fill-opacity:0; stroke:#999; stroke-width:2;"/>
		<guitar :x="40" :y="30" :width="width - 70" :height="height * 0.25" :frets="frets" :tuning="tuning"/>
		<circle v-if="false" :cx="x" :cy="y" r="10" v-on:click="test()"></circle>
	</svg>`
});



// App controller
new Vue({
	el: '#app',

	data: {
		keys: ['C','C#/Db','D','D#/Eb','E','F','F#/Gb','G','G#/Ab','A','A#/Bb','B'],
		intervals: ['P1','m2','M2','m3','M3','P4','TT','P5','m6','M6','m7','M7'],
		colors: ['#ff0000','#ff8000','#f8f800','#88ff00','#00f800','#00ffc0','#00f8f8','#0080ff','#0000ff','#8000ff','#ff00ff','#ff0080'],
	},

	computed: {
		windowHeight: function(){ return window.innerHeight; },
		windowWidth: function(){ return window.innerWidth; },
	},

	methods: {
	},
});
