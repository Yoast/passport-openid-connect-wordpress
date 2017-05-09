let openid = require( "openid-client" );
let urlUtil = require( "url" );

class Strategy {
	/**
	 *
	 * @param {Object} config The configuration for this strategy.
	 * @param {string} config.callbackPath The callback path where the oauth server sends the user back to.
	 * @param {string} config.callbackUrl The callback URL to which the OAuth server should send the user back to.
	 * @param {string} config.clientID The client ID to send to the OAuth server.
	 * @param {string} config.clientSecret the client secret to send to the OAuth server.
	 * @param {Function} verify The function to verify the OAuth response.
	 */
	constructor( config, verify ) {
		this.name = "passport-openid-connect-wordpress";
		this.config = Object.assign( {}, config );

		this._client = null;
		this._tokenSet = null;
		this._verify = verify;

		this.init()
			.then( () => {
				// eslint-disable-next-line no-console
				console.log( "Initialization of WP OAuth OpenID Connect discovery process completed." );
			} );
	}

	init() {
		if ( ! this.config.remoteHost ) {
			throw new Error( "The WP OAuth OpenID Connect Strategy requires a remoteHost " +
				"in the configuration. This is used to auto discover the oauth2 endpoints." );
		}

		let httpOptions = this.config.httpOptions || {};
		let defaultHttpOptions = Object.assign( { followRedirect: true }, httpOptions );

		openid.Issuer.defaultHttpOptions = defaultHttpOptions;

		return openid.Issuer.discover( this.config.remoteHost )
			.then( ( issuer ) => {
				this._client = new issuer.Client( {
					/* eslint-disable camelcase */
					client_id: this.config.clientID,
					client_secret: this.config.clientSecret,
					/* eslint-enable camelcase */
				} );
			} )
			.catch( () => {
				// eslint-disable-next-line no-console
				throw new Error( "Could not establish connection to WordPress oauth provider, aborting..." );
			} );
	}

	/**
	 * Handles a verified user
	 *
	 * @param {Object} err Error object if any.
	 * @param {Object} user User object if successfull.
	 * @param {Object} info Optional info.
	 * @returns {void}
	 */
	verifiedUser( err, user, info ) {
		if ( err ) {
			this.error( err );
		}
		if ( ! user ) {
			this.fail( info );
		}

		this.success( user, info );
	}

	/**
	 * Handles passport authentication calls
	 *
	 * @param {IncomingMessage} req The request for authentication.
	 * @returns {void}
	 */
	authenticate( req ) {
		if ( this.isCallbackUrl( req.url ) ) {
			this._client.authorizationCallback( this.config.callbackUrl, req.query )
				.then( ( tokenSet ) => {
					this._tokenSet = tokenSet;

					return this.getUserInfo();
				} )
				.then( Strategy.transformWpUserInfo )
				.then( ( userInfo ) => {
					this._verify( req, this._tokenSet.access_token, this._tokenSet.refresh_token, userInfo, this.verifiedUser.bind( this ) );
				} )
				.catch( ( err ) => {
					// eslint-disable-next-line no-console
					console.warn( "Could not authorize user", err );
				} );

			return;
		}

		let authUrl = this._client.authorizationUrl( {} );

		this.redirect( authUrl );
	}

	/**
	 * Transforms WordPress user info to something more suitable for LoopBack.
	 *
	 * @param {Object} wpUser The user info we retrieved from WordPress.
	 * @returns {Object} User info that LoopBack can work with.
	 */
	static transformWpUserInfo( wpUser ) {
		let transformedData = {
			id: wpUser.ID,
			username: wpUser.user_login,
			email: wpUser.user_email,
			niceName: wpUser.user_nicename,
			displayName: wpUser.display_name,
		};

		// eslint-disable-next-line no-undefined
		if ( Object.values( transformedData ).includes( undefined ) ) {
			throw new Error( "Missing WordPress user data" );
		}

		return transformedData;
	}

	/**
	 * Returns whether the given URL is a callback URL
	 *
	 * @param {string} url The given URL.
	 * @returns {boolean} Whether the given URL is a callback URL.
	 */
	isCallbackUrl( url ) {
		let parsedUrl = urlUtil.parse( url );

		return parsedUrl.pathname === this.config.callbackPath;
	}

	/**
	 * Does a request to the server for user info
	 *
	 * @returns {Promise} Resolves when the user info has been retrieved.
	 */
	getUserInfo() {
		return this._client.userinfo( this._tokenSet.access_token );
	}

	/**
	 * Refreshes the access token with the refresh token.
	 *
	 * @param {string} refreshToken The refresh token to use.
	 */
	refresh( refreshToken ) {
		return this._client.refresh( refreshToken );
	}
}

module.exports = Strategy;
