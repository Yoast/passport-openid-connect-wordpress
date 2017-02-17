const Strategy = require( "../lib/Strategy" );

describe( "Strategy", () => {
	describe( "transformWpUserInfo", () => {
		it( "transforms the WordPress user information to loopback compatible information", () => {
			let expected = {
				id: 1,
				username: "a-username",
				email: "anemail",
				niceName: "A very nice name",
				displayName: "A WordPress display name",
			};
			let input = {
				ID: 1,
				user_login: "a-username",
				user_email: "anemail",
				user_nicename: "A very nice name",
				display_name: "A WordPress display name",
			};

			let actual = Strategy.transformWpUserInfo( input );

			expect( actual ).toEqual( expected );
		} );

		it( "ignores non-wp values", () => {
			let expected = {
				id: 1,
				username: "a-username",
				email: "anemail",
				niceName: "A very nice name",
				displayName: "A WordPress display name",
			};
			let input = {
				ID: 1,
				user_login: "a-username",
				user_email: "anemail",
				user_nicename: "A very nice name",
				display_name: "A WordPress display name",
				other_data: "Some data",
				much_more: "Stuff",
			};

			let actual = Strategy.transformWpUserInfo( input );

			expect( actual ).toEqual( expected );
		} );

		it( "errors if the wp data is not present", () => {
			expect.assertions( 1 );
			let input = {
				some_other: "data",
			};

			try {
				Strategy.transformWpUserInfo( input );
			} catch ( error ) {
				expect( error.message ).toEqual( "Missing WordPress user data" );
			}
		} );
	} );
} );
