$file = "src\pages\Students.tsx"
$content = Get-Content $file -Raw

# Substituir o bloco problemático
$old = @"
                      {student.weight && student.bodyFat && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium">Peso:</span> {student.weight} kg • {student.bodyFat.toFixed(1)}% gordura
                          </div>
                          <Button variant="outline" size="sm" onClick={() => navigate(``/evaluation?student=$${student.id}``}>
                            <Calendar className="h-3 w-3 mr-1" />
                            Nova Avaliação
                          </Button>
                        </div>
                      )}
"@

$new = @"
                      <div className="flex items-center justify-between">
                        {student.weight && student.bodyFat ? (
                          <div className="text-sm">
                            <span className="font-medium">Peso:</span> {student.weight} kg • {student.bodyFat.toFixed(1)}% gordura
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Nenhuma avaliação realizada
                          </div>
                        )}
                        <Button variant="outline" size="sm" onClick={() => navigate(``/evaluation?student=$${student.id}``}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {student.weight && student.bodyFat ? 'Nova Avaliação' : 'Primeira Avaliação'}
                        </Button>
                      </div>
"@

$content = $content -replace [regex]::Escape($old), $new
Set-Content $file -Value $content -NoNewline
Write-Host "Arquivo corrigido com sucesso!"
