/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

( function() {

var addressBook = tizen.contact.getDefaultAddressBook(),
	pushToArrayAndUnroll = function( source, destination, fieldName ) {
		var item, types, index, typeIndex;

		for ( index in source ) {
			item = source[ index ];
			if ( item[ fieldName ] ) {
				types = item.types;
				if ( types && types.length > 0 ) {
					for ( typeIndex in types ) {
						destination.push({
							"type": types[ typeIndex ],
							"value": item[ fieldName ],
							// If isDefault is true for this item and it has multiple types,
							// then only the first type will have default set to true in Cordova
							"default": ( item.isDefault && typeIndex === 0 )
						});
					}
				}
			}
		}
	},
	tizenToCordova = function( tizenContact ) {
		var index, typeIndex, types, item, cordovaContact,
			tizenAddresses = tizenContact.addresses,
			tizenOrganizations = tizenContact.organizations,
			tizenUrls = tizenContact.urls;

		cordovaContact = {
			id: tizenContact.id,
			displayName: null,
			name: null,
			nickname: null,
			phoneNumbers: [],
			emails: [],
			addresses: [],
			ims: [],
			organizations: [],
			birthday: tizenContact.birthday || null,
			note: null,
			photos: [],
			urls: []
		};

		// Name
		if ( tizenContact.name ) {
			cordovaContact.displayName = tizenContact.name.displayName || null;

			cordovaContact.name = {
				formatted: tizenContact.name.displayName || null,
				familyName: tizenContact.name.lastName || null,
				givenName: tizenContact.name.firstName || null,
				middleName: tizenContact.name.middleName || null,
				honorificPrefix: tizenContact.name.prefix || null,
				honorificSuffix: tizenContact.name.suffix || null
			};

			cordovaContact.nickname =
				( tizenContact.name.nicknames && tizenContact.name.nicknames.length > 0 ) ?
					tizenContact.name.nicknames[ 0 ] : null;
		}

		// Phone number
		// Since a Tizen phone number can have multiple types, we unroll each of the
		// types into its own Cordova phone number
		pushToArrayAndUnroll( tizenContact.phoneNumbers || [], cordovaContact.phoneNumbers, "number" );

		// Email
		// Since a Tizen email can have multiple types, we unroll each of the
		// types into its own Cordova email
		pushToArrayAndUnroll( tizenContact.emails || [], cordovaContact.emails, "email" );

		// Address
		// Since a Tizen addresses can have multiple types, we unroll each of the
		// types into its own Cordova address
		for ( index in tizenAddresses ) {
			item = tizenAddresses[ index ];
			types = item.types;
			if ( types && types.length > 0 ) {
				for ( typeIndex in types ) {
					cordovaContact.addresses.push({
						// If isDefault is true for this item and it has multiple types,
						// then only the first type will have default set to true in Cordova
						"pref": ( item.isDefault && typeIndex === 0 ),
						"type": types[ typeIndex ],
						"formatted": null,
						"streetAddress": item.streetAddress || null,
						"locality": item.city || null,
						"region": item.region || null,
						"postalCode": item.postalCode || null,
						"country": item.country || null
					});
				}
			}
		}

		// Organizations
		for ( index in tizenOrganizations ) {
			item = tizenOrganizations[ index ];
			cordovaContact.organizations.push({
				// Tizen doesn't have a "preferred" organization ...
				"pref": false,
				// ... nor a "type"
				"type": "HOME",
				"name": item.name || null,
				"department": item.department || null,
				"title": item.title || null
			});
		}

		// Note
		// We can only transfer the first note to the Cordova contact
		if ( tizenContact.notes && tizenContact.notes.length > 0 ) {
			cordovaContact.note = tizenContact.notes[ 0 ];
		}

		// Photo
		// The Tizen Contact provides only one photo URI
		if ( tizenContact.photoURI ) {
			cordovaContact.photos.push({
				"type": "HOME",
				"value": tizenContact.photoURI,
				// This is the only photo, so why not?
				"pref": true
			});
		}

		// URLs
		for ( index in tizenUrls ) {
			item = tizenUrls[ index ];
			if ( item.url ) {
				cordovaContact.urls.push({
					"type": item.type,
					"value": item.url,
					"pref": false
				});
			}
		}

		return cordovaContact;
	};

module.exports = {
	save: function() {
		var x;
	},
	remove: function() {
		var x;
	},
	search: function( successCallback, failureCallback, args ) {
		var cordovaContact,
			sortingMode = new tizen.SortMode( 'name.firstName', 'ASC' ),
			phoneFilter = new tizen.AttributeFilter( 'phoneNumbers.number', 'CONTAINS', '' ),
			onContactFindSuccess = function( contacts ) {
				var index, cordovaContacts = [];

				for ( index in contacts ) {
					try {
						cordovaContact = tizenToCordova( contacts[ index ] );
					} catch( e ) {
						console.log( e.message );
					}
					cordovaContacts.push( cordovaContact );
				}
				successCallback( cordovaContacts );
			},
			onError = function( error ) {
				failureCallback( error.name );
			};
		addressBook.find( onContactFindSuccess, onError, phoneFilter, sortingMode );
	},
	cleanup: function(){}
};

require("cordova/tizen/commandProxy").add("Contacts", module.exports);

})();
