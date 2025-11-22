import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../core/constants/app_constants.dart';

class MarketplaceBrowseScreen extends StatefulWidget {
  const MarketplaceBrowseScreen({Key? key}) : super(key: key);

  @override
  State<MarketplaceBrowseScreen> createState() => _MarketplaceBrowseScreenState();
}

class _MarketplaceBrowseScreenState extends State<MarketplaceBrowseScreen> {
  bool _loading = false;
  String _query = '';
  List<dynamic> _coaches = [];

  @override
  void initState() {
    super.initState();
    _fetchCoaches();
  }

  Future<void> _fetchCoaches() async {
    setState(() => _loading = true);
    try {
      final uri = Uri.parse('${AppConstants.apiUrl}/marketplace/coaches?q=${Uri.encodeQueryComponent(_query)}');
      final res = await http.get(uri);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final body = json.decode(res.body) as Map<String, dynamic>;
        setState(() {
          _coaches = body['data'] as List<dynamic>? ?? [];
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Coach Marketplace'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Search coaches',
              ),
              onChanged: (v) => _query = v,
              onSubmitted: (_) => _fetchCoaches(),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.separated(
                    itemCount: _coaches.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final c = _coaches[index] as Map<String, dynamic>;
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundImage: (c['profile_image_url'] as String?) != null
                              ? NetworkImage(c['profile_image_url'] as String)
                              : null,
                          child: (c['profile_image_url'] as String?) == null
                              ? Text(((c['display_name'] as String?) ?? 'C').substring(0, 1).toUpperCase())
                              : null,
                        ),
                        title: Text(c['display_name'] as String? ?? 'Coach'),
                        subtitle: Text(c['title'] as String? ?? ''),
                        trailing: Text(c['hourly_rate'] != null ? '\$${c['hourly_rate']}/${c['currency'] ?? 'USD'}' : ''),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}


