require 'locomotive/carrierwave/base'
require 'locomotive/carrierwave/asset'
require 'locomotive/carrierwave/patches'

# Allow retina images
CarrierWave::SanitizedFile.sanitize_regexp = /[^a-zA-Z0-9\.\-\+_\@]/
