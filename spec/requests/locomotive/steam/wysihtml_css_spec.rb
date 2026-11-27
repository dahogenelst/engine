# encoding: utf-8

describe Locomotive::Steam::Middlewares::WysihtmlCss do

  let(:url)         { 'http://example.com/' }
  let(:path)        { 'index' }
  let(:html)        { 'Hello world' }
  let(:page)        { nil }
  let(:app)         { ->(env) { [200, env, [html]] } }
  let(:env)         { env_for(url).tap { |e| e['steam.page'] = page; e['steam.path'] = path } }
  let(:middleware)  { described_class.new(app) }

  subject { middleware.call(env).last.first }

  describe 'not a html page' do

    let(:page) { instance_double('SimplePage', redirect: false, response_type: 'application/xml') }

    it { is_expected.to eq('Hello world') }

  end

  describe 'html page' do

    let(:page) { instance_double('SimplePage', redirect: false, response_type: 'text/html') }

    describe 'no head tag' do

      it { is_expected.to eq('Hello world') }

    end

    describe 'head tag found' do

      let(:html) { '<html><head></head><body><p class="wysiwyg-text-align-center">Hi</p></body></html>' }

      it { is_expected.to match(%r(<html><head><link rel="stylesheet" type="text/css" href="/assets/locomotive/wysihtml5_editor-[^.]+.css"></head><body>)) }

      context 'no text styled by the editor' do

        let(:html) { '<html><head></head><body><p>Hi</p></body></html>' }

        it { is_expected.to eq('<html><head></head><body><p>Hi</p></body></html>') }

      end

      context 'Google AMP page' do

        let(:path) { '_amp/simple' }

        it { is_expected.not_to include('wysihtml5_editor') }

      end

    end

  end

end
