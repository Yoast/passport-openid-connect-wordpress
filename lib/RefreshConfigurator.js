/**
 * Contains configuration to refresh the access token and update it to the identity in LoopBack.
 */
class RefreshConfigurator {
	constructor( strategy ) {
		this._strategy = strategy;
	}

	/**
	 * Set up data models for making it possible to refresh tokens.
	 *
	 * @param {Object} options Options for models
	 * @returns {void}
	 */
	setupModels( options ) {
		let IdentityModel = options.identityModel;
		let strategy = this._strategy;

		/**
		 * Refreshes the access token for the identity.
		 *
		 * @returns {Promise} Resolves with the response from the server.
		 */
		IdentityModel.prototype.refreshAccessToken = function() {
			let refreshToken = this.credentials.refreshToken;

			return strategy.refresh( refreshToken )
				.then( ( tokenSet ) => {
					return this.updateAttribute( "credentials",
						{
							accessToken: tokenSet.access_token,
							refreshToken: refreshToken,
						}
					);
				} );
		};
	}
}

module.exports = RefreshConfigurator;
