describe Locomotive::Dragonfly do

  let(:image) { File.join(Rails.root, '..', 'fixtures', 'assets', '5k.png') }

  describe '.resize_url' do

    subject { described_class.resize_url(image, '10x10', 42) }

    it 'adds the timestamp without breaking the query string (sha)' do
      expect(subject).to match(%r{\?sha=\h+&42\z})
    end

    it 'leaves the url alone without a timestamp' do
      expect(described_class.resize_url(image, '10x10')).to match(%r{\?sha=\h+\z})
    end

  end

end
