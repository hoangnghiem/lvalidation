# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_jstutor_session',
  :secret      => 'e600cd8a192aa7df1208f85e5228c0a290be30047aa69e0350f7f142b720f98e70345d99a3cbb642003ff9ade4ad676662156f0813b32c59955d270bf527ad67'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
