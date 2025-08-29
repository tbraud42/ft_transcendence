{{- with secret "secret/myapp/config" -}}
{{- range $k, $v := .Data.data -}}
{{ $k }}={{ $v }}
{{- end -}}
{{- end -}}
