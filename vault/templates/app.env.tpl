{{- with secret "secret/myapp/config" -}}
  {{- $d := .Data.data -}}
  {{- $inner := index $d "data" }}
  {{- if $inner -}}
    {{- range $k, $v := $inner }}
{{$k}}={{$v}}
    {{- end -}}
  {{- else -}}
    {{- range $k, $v := $d }}
{{$k}}={{$v}}
    {{- end -}}
  {{- end -}}
{{- end -}}
