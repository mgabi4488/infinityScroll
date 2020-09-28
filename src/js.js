/**
 *
 */
class InfinityScroll {

	/**
	 *
	 */
	constructor( settings ) {
		// 
		this.setProperties();
		// set backgup of the user settings
		this.backUpSettings = settings;
		// merge the default settings with the user settings
		this.completeSettings = this.userSettings;
		// set the object we want to listen to the scrolling
		this.instanceOn = this.settings;
	}

	/**
	 * The method is a setter method that will add the class instance to the object the user
	 * selected
	 */
	set instanceOn( settings ) {
		// 
		let _ = this;
		// 
		this.el = typeof settings.el === 'object' ? settings.el : document.querySelector(settings.el);
		// 
		if ( this.el == null ) throw 'Missing main object to initialize the plugin on';
		// wrap the user element with the plugin element
		this.wrap(this.el);
		// 
		this.el.addEventListener('scroll', function(ev){
			let offsetHeight = ev.target.offsetHeight; // element height
			let scrollTop = ev.target.scrollTop; // pixels scrolled from element top
			let scrollHeight = ev.target.scrollHeight;// pixels of the whole element.
			// 
			if ( (offsetHeight + scrollTop) == scrollHeight ) {
				// 
				_.handleProgress('fetching');
				// 
				fetch(_.getRequestObject())
				// check the responce status
				.then(( response ) => {
					// if the responce has faild we show error
					if ( !response.ok ) {
						throw new Error('something wernt wrong, status code: ' + response.status);
					}
					// convert the responce to json
					return response.json();
				})
				// finish the responce
				.then(( data ) => {
					// finish the loading proccess
					_.handleProgress('done');
					// run fail callback
					if ( _.getOption('onRequestSuccess') ) _.getOption('onRequestSuccess')(data);
				})
				// show 
				.catch(( error ) => {
					// even if there is error finish the loading procces
					_.handleProgress('done');
					// run fail callback
					if ( _.getOption('onRequestFail') ) _.getOption('onRequestFail')(error);
					// show the error in console
					console.error('Error:', error);
				});
				// run custom callback
				if ( _.getOption('onRequestStart') ) _.getOption('onRequestStart')(this.el);
			}
		});
		// save the 
		this.el.InfinityScroll = this.settings;
	}

	/**
	 *
	 */
	set backUpSettings( settings ) {
		this.userSettings = settings;
	}

	/**
	 *
	 */
	set completeSettings( userSettings ) {
		// unpack objects, merge them and overwrite the default settings with the user settings
		this.settings = {...this.defSettings, ...userSettings};
	}

	/**
	 *
	 */
	get defSettings() {
		// 
		let _ = this;
		// 
		return {
			el: null,
			dataPath: null,
			onRequestStart: null,
			onRequestFinish: null,
			onRequestSuccess: null,
			onRequestFail: null,
			onDataEnd: null,
			requestObject: false,
			customLoadingAnimation: false,
			disableLoadingAnimation: false
		};
	}

	/**
	 *
	 */
	get path() {
		return this.getOption('dataPath');
	}

	/**
	 *
	 */
	get object() {
		return this.el;
	}

	/**
	 * The method is wrapping the selected element that the user wanted to add
	 * the infinity scroll to
	 */
	wrap( el ) {
		// create new dom element
		this.wrapper = document.createElement('div');
		this.wrapper.classList.add(this.nameSpace + '-wrapper');
		// wrap the user element with the new created wrapper
		el.parentNode.appendChild(this.wrapper);
		this.wrapper.appendChild(el);
	}

	/**
	 *
	 */
	setProperties( el ) {
		// 
		let _ = this;
		// 
		_.nameSpace = 'i-f';
		// 
		_.inProgress = false;
		// 
		_.methods = {
			setOption: function( optionName, value ) {
				// security - validate option supports
				if ( !_.settings?.[optionName] ) throw 'The option you are trying to apply is not supported';
				// set the option
				_.settings[optionName] = value;
			}
		};
		_.events = {

		};
	}

	/**
	 * The method is returning the option
	 */
	getOption( optionName ) {
		// 
		let option  = this.settings?.[optionName];
		// security - validate option supports
		if ( typeof option === 'undefined' ) throw 'The option you are trying to apply is not supported';
		// return the option
		return option;
	}

	/**
	 * The method is returning the request object
	 */
	getRequestObject() {
		// if the user has custom request object use it
		if ( this.getOption('requestObject') ) return this.getOption('requestObject');
		// use default data
		let requestObject = new Request(this.path, {
			method: 'GET',
			headers: new Headers(), // just set empty headers
			mode: 'cors',
			cache: 'default',
		});
		// return the default request object
		return requestObject;
	}

	/**
	 *
	 */
	handleProgress( status ) {
		// 
		switch ( status ) {
			case 'fetching':
				// 
				this.inProgress = true;
				// 
				if ( !this.getOption('disableLoadingAnimation') ) {
					// 
					this.loadingAnimation = this.getLoadingAnimation;
					// 
					this.wrapper.appendChild(this.loadingAnimation);
				}
				break; 
			case 'done':
				// 
				this.inProgress = false;
				// 
				if ( !this.getOption('disableLoadingAnimation') ) {
					this.loadingAnimation.remove();
				}
				break;
		}
	}

	/**
	 *
	 */
	get getLoadingAnimation() {
		// 
		let loadingAnimation = null;
		// 
		if ( this.getOption('customLoadingAnimation') === null ) throw 'Wrong loading animation format'; 
		// 
		if ( this.getOption('customLoadingAnimation') ) {
			// use already set node element
			if ( isNode(this.getOption('customLoadingAnimation')) ) {
				loadingAnimation = this.getOption('customLoadingAnimation');
			// 
			} else {
				// 
				let doc = new DOMParser().parseFromString(this.getOption('customLoadingAnimation'), "text/html");
				let isHtml = Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
				// 
				if ( isHtml ) loadingAnimation = doc.body.childNodes[0];
			}
		// create new dom element
		} else {
			loadingAnimation = document.createElement('span');
			loadingAnimation.innerHTML = 'loading...';
			loadingAnimation.style.display = 'block';
			loadingAnimation.style.textAlign = 'center';
		}
		// 
		return loadingAnimation;

		/**
		 * Returns true if it is a DOM node
		 * Solution: https://stackoverflow.com/a/384380/6352916
		 */
		function isNode( o ) {
			return (
				typeof Node === "object" ? o instanceof Node : o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
			);
		}
	}
}