class OnDeviceModel {
  const OnDeviceModel({
    required this.id,
    required this.name,
    required this.backend,
    required this.downloadUrl,
    required this.sizeMB,
    required this.checksum,
  });

  final String id;
  final String name;
  final String backend;
  final String downloadUrl;
  final int sizeMB;
  final String checksum;
}

const defaultOnDeviceModel = OnDeviceModel(
  id: 'phi2-mini-q4',
  name: 'Phi-2 Mini (Q4)',
  backend: 'metal/nnapi',
  downloadUrl:
      'https://huggingface.co/microsoft/Phi-2/resolve/main/q4/phi-2-mini-q4.gguf?download=true',
  sizeMB: 210,
  checksum: 'sha256-phi2-mini-q4',
);

