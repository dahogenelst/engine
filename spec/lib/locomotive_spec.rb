describe Locomotive do

  describe '.mounted_on' do

    it 'loads the routes first (lazy in development since Rails 8), the middlewares ask before the router' do
      expect(Rails.application).to receive(:reload_routes_unless_loaded).and_call_original
      expect(Locomotive.mounted_on).to eq '/locomotive'
    end

  end

end
