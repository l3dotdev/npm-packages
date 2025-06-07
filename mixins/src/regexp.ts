import { isLeadingSurrogate } from "./helpers/is-leading-surrogate.js";
import { isTrailingSurrogate } from "./helpers/is-trailing-surrogate.js";

if (typeof RegExp.escape !== "function") {
	function UTF16SurrogatePairToCodePoint(lead: number, trail: number) {
		// var cp = (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
		return String.fromCharCode(lead) + String.fromCharCode(trail);
	}

	function codePointAt(string: string, position: number) {
		const size = string.length;
		const first = string.charCodeAt(position);
		const cp = string.charAt(position);
		const firstIsLeading = isLeadingSurrogate(first);
		const firstIsTrailing = isTrailingSurrogate(first);
		if (!firstIsLeading && !firstIsTrailing) {
			return {
				"[[CodePoint]]": cp,
				"[[CodeUnitCount]]": 1,
				"[[IsUnpairedSurrogate]]": false
			};
		}
		if (firstIsTrailing || position + 1 === size) {
			return {
				"[[CodePoint]]": cp,
				"[[CodeUnitCount]]": 1,
				"[[IsUnpairedSurrogate]]": true
			};
		}
		const second = string.charCodeAt(position + 1);
		if (!isTrailingSurrogate(second)) {
			return {
				"[[CodePoint]]": cp,
				"[[CodeUnitCount]]": 1,
				"[[IsUnpairedSurrogate]]": true
			};
		}

		return {
			"[[CodePoint]]": UTF16SurrogatePairToCodePoint(first, second),
			"[[CodeUnitCount]]": 2,
			"[[IsUnpairedSurrogate]]": false
		};
	}

	function stringToCodePoints(string: string) {
		const codePoints: string[] = [];
		const size = string.length;
		let position = 0;
		while (position < size) {
			const cp = codePointAt(string, position);
			codePoints.push(cp["[[CodePoint]]"]);
			position += cp["[[CodeUnitCount]]"];
		}
		return codePoints;
	}

	function codePointStringToNum(c: string) {
		const first = c.charCodeAt(0);
		if (first < 0xd800 || first > 0xdbff || c.length === 1) {
			return first;
		}
		const second = c.charCodeAt(1);
		if (second < 0xdc00 || second > 0xdfff) {
			return first;
		}
		return (first - 0xd800) * 1024 + (second - 0xdc00) + 0x10000;
	}

	const syntaxCharacter = "^$\\.*+?()[]{}|";

	const otherPunctuators = ",-=<>#&!%:;@~'`\"";

	const table64 = {
		"\u0009": "t",
		"\u000a": "n",
		"\u000b": "v",
		"\u000c": "f",
		"\u000d": "r",
		__proto__: null
	};

	function UTF16EncodeCodePoint(cp: number) {
		if (cp <= 65535) {
			return String.fromCharCode(cp);
		}
		const cu1 = String.fromCharCode(Math.floor((cp - 65536) / 1024) + 0xd800);
		const cu2 = String.fromCharCode(cp - (65536 % 1024) + 0xdc00);
		return cu1 + cu2;
	}

	function UnicodeEscape(C: string) {
		const n = C.charCodeAt(0);

		return "\\u" + n.toString(16).toLowerCase().padStart(4, "0");
	}

	function EncodeForRegExpEscape(c: number) {
		const encoded = UTF16EncodeCodePoint(c);

		if (syntaxCharacter.indexOf(encoded, 0) > -1 || encoded === "\u002F") {
			// step 1
			return "\\" + encoded; // step 1.a
		} else if (encoded in table64) {
			// step 2
			return "\\" + table64[encoded as keyof typeof table64]; // step 2.a
		}

		if (
			otherPunctuators.indexOf(encoded, 0) > -1 ||
			/^\s$/.test(encoded) ||
			/^[\n\r\u2028\u2029]$/.test(encoded) ||
			isLeadingSurrogate(c) ||
			isTrailingSurrogate(c)
		) {
			// step 5
			if (c < 0xff) {
				// step 5.a
				const hex = c.toString(16); // step 5.a.i
				return "\\x" + hex.padStart(2, "0"); // step 5.a.ii
			}

			let escaped = ""; // step 5.b

			const codeUnits = encoded; // step 5.c

			for (const cu of codeUnits) {
				// step 5.d
				escaped += UnicodeEscape(cu); // step 5.d.i
			}

			return escaped; // step 5.e
		}

		return encoded; // step 6
	}

	RegExp.escape = function (S: string) {
		let escaped = ""; // step 2

		const cpList = stringToCodePoints(S); // step 3

		for (const c of cpList) {
			// step 4
			if (escaped === "" && /^[\da-zA-Z]$/.test(c)) {
				// step 4.a
				const hex = codePointStringToNum(c).toString(16); // step 4.a.iii

				escaped += "\\x" + hex; // step 4.a.v
			} else {
				// step 4.b
				escaped += EncodeForRegExpEscape(codePointStringToNum(c)); // step 4.b.i
			}
		}

		return escaped; // step 5
	};
}
