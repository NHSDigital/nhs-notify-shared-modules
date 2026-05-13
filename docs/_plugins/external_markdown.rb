# frozen_string_literal: true
# Adapted from jekyll-remote-include by netrics
# https://github.com/netrics/jekyll-remote-include

module Jekyll
  class ExternalMarkdownTag < Liquid::Tag
    def initialize(tag_name, markup, tokens)
      super
      @markup = markup.strip
    end

    def render(context)
      # Get site from context
      site = context.registers[:site]

      # Get the site root directory (parent of docs/)
      site_root = File.expand_path('..', site.source)

      # Construct the full path
      full_path = File.join(site_root, @markup)

      unless File.exist?(full_path)
        return "<p><strong>Error:</strong> File not found: <code>#{@markup}</code></p>"
      end

      # Read the content and force UTF-8 encoding
      content = File.read(full_path).force_encoding('utf-8')

      # Convert markdown to HTML using Jekyll's markdown converter
      converter = site.find_converter_instance(Jekyll::Converters::Markdown)
      html = converter.convert(content)

      # Return HTML wrapped in a way that prevents escaping
      html
    end
  end
end

Liquid::Template.register_tag('external_markdown', Jekyll::ExternalMarkdownTag)
