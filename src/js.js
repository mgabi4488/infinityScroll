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
		_.setEl = {
			isRoot: true,
			el: settings.el,
			trigger: settings.triggerEvent,
		};
		// 
		if ( settings.customController?.el ) {
			_.setEl = {
				isRoot: false,
				el: settings.customController.el,
				trigger: settings.customController.triggerEvent,
			};
		}
		// wrap the user element with the plugin element
		_.wrap(_.el);
		// save the 
		_.el.InfinityScroll = _.settings;
	}

	/**
	 *
	 */
	set setEl( settings ) {
		// 
		settings.el = typeof settings.el === 'object' ? settings.el : document.querySelector(settings.el);
		// 
		if ( settings.el == null ) throw 'Missing main to initialize the plugin on';
		// 
		if ( settings.isRoot ) {
			this.el = settings.el;
		// 
		} else {
			this.settings.customController.el = settings.el;
		}
		// 
		this.setTrigger = settings;
	}

	/**
	 *
	 */
	set setTrigger( settings ) {
		//
		let triggers = this.getSupportedTriggers(settings.trigger);
		//
		for ( let i = 0; i < triggers.length ; i++ ) {
			settings.el.addEventListener(triggers[i],this.events[triggers[i]]);
		}
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
	getSupportedTriggers( userTriggers ) {
		//
		let triggers = [];
		userTriggers = userTriggers.split(' ');
		//
		for ( let i = 0; i < userTriggers.length ; i++ ) {
			// 
			if ( !this.events?.[userTriggers[i]] ) continue;
			// 
			triggers.push(userTriggers[i]);
		}
		// 
		return triggers;
	}

	/**
	 *
	 */
	get defSettings() {
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
			disableLoadingAnimation: false,
			triggerEvent: 'scroll',
			customController: false
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
		isNode = ( o ) => {
			return (
				typeof Node === "object" ? o instanceof Node : o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
			);
		}
	}

	/**
	 * The method is returning the request object
	 */
	get getRequestObject() {
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
	setProperties() {
		// 
		let _ = this;
		// 
		_.nameSpace = 'i-f';
		// 
		_.inProgress = false;
		// 
		_.events = {
			scroll: ( e ) => {
				let offsetHeight = e.target.offsetHeight; // element height
				let scrollTop = e.target.scrollTop; // pixels scrolled from element top
				let scrollHeight = e.target.scrollHeight;// pixels of the whole element.
				// 
				if ( (offsetHeight + scrollTop) == scrollHeight ) {
					// 
					_.handleProgress('fetching');
					// 
					_.events.fetchNextPage();
					// run custom callback
					if ( _.getOption('onRequestStart') ) _.getOption('onRequestStart')(this.el);
				}
			},
			click: ( e ) => {
				// 
				_.handleProgress('fetching');
				// 
				_.events.fetchNextPage();
				// run custom callback
				if ( _.getOption('onRequestStart') ) _.getOption('onRequestStart')(this.el);
			},
			fetchNextPage: () => {
				// 
				fetch(_.getRequestObject)
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
			}
		};
	}

	// 
	destroy() {
		this.wrapper.parentNode.appendChild(this.el);
		this.wrapper.remove();
		this.el.InfinityScroll = null;
		// get the trigger events
		let triggers = this.getSupportedTriggers();
		// remove all of the events
		for ( let i = 0; i < triggers.length ; i++ ) {
			this.el.removeEventListener(triggers[i],this.events[triggers[i]]);
		}
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
	 * The method is returning the option
	 */
	getOption( optionName ) {
		// 
		let option  = this.settings?.[optionName];
		// security - validate option supports
		if ( typeof option === 'undefined' ) throw 'Trying to apply to unsupported method option';
		// return the option
		return option;
	}

	/**
	 *
	 */
	setOption( optionName, value ) {
		// security - validate option supports
		if ( !this.settings?.[optionName] ) throw 'Trying to apply to unsupported method option';
		// set the option
		this.settings[optionName] = value;
	}
}